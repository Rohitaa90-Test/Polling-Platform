import { io } from 'socket.io-client';
import fetch from 'node-fetch'; // if not installed, we can just use native fetch if Node 18+

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function runTests() {
    console.log('🚀 Starting Intervue Assignment Validation Test Suite...\n');

    let passed = 0;
    let failed = 0;
    let activePollId: string | null = null;

    const assert = (condition: boolean, testName: string, errorMessage: string) => {
        if (condition) {
            console.log(`✅ [PASS] ${testName}`);
            passed++;
        } else {
            console.error(`❌ [FAIL] ${testName} \n    -> ${errorMessage}`);
            failed++;
        }
    };

    try {
        // ---------------------------------------------------------
        // TEST 1: System Health Check
        // ---------------------------------------------------------
        console.log('--- Phase 1: Basic Health & Architectue ---');
        try {
            const res = await fetch(`${BACKEND_URL}/health`);
            const body = await res.json() as any;
            assert(res.status === 200 && body.status === 'ok', 'Server is running and healthy', 'Health endpoint returned non-200');
        } catch (e: any) {
            assert(false, 'Server is running and healthy', e.message);
            console.error('🚨 SERVER IS UNREACHABLE. Terminating tests.');
            return;
        }

        // ---------------------------------------------------------
        // TEST 2: Poll History Fetch (DB Integration check)
        // ---------------------------------------------------------
        console.log('\n--- Phase 2: Database Check ---');
        try {
            const res = await fetch(`${BACKEND_URL}/api/polls/history`);
            const data = await res.json();
            assert(res.status === 200 && Array.isArray(data), 'GET /api/polls/history returns valid array', 'History API did not return an array');
        } catch (e: any) {
            assert(false, 'GET /api/polls/history returns valid array', e.message);
        }

        // ---------------------------------------------------------
        // TEST 3: Active Poll Fetch (State Recovery resilience)
        // ---------------------------------------------------------
        console.log('\n--- Phase 3: Resilience & State Recovery ---');
        try {
            const res = await fetch(`${BACKEND_URL}/api/polls/current`);
            const data = await res.json() as any;
            assert(res.status === 200 && (data.poll === null || typeof data.poll === 'object'), 'GET /api/polls/current works (Resilience recovery endpoint)', 'Current API failed');
            if (data.poll) {
                activePollId = data.poll.id;
                assert(typeof data.remainingTime === 'number', 'Server calculates remaining time dynamically for late-joiners', 'Missing remaining time in payload');
            }
        } catch (e: any) {
            assert(false, 'GET /api/polls/current works', e.message);
        }

        // ---------------------------------------------------------
        // TEST 4: Socket Connectivity (Realtime Communication)
        // ---------------------------------------------------------
        console.log('\n--- Phase 4: Socket & Real-Time Functionality ---');

        await new Promise<void>((resolve) => {
            const socket = io(BACKEND_URL, { reconnection: false });

            const timeout = setTimeout(() => {
                assert(false, 'Socket connected successfully', 'Connection timed out');
                socket.disconnect();
                resolve();
            }, 3000);

            socket.on('connect', () => {
                clearTimeout(timeout);
                assert(true, 'Socket connected successfully (Student/Teacher transport layer)', '');

                socket.emit('join-as-student', { studentId: 'test-123', studentName: 'Test Bot' });

                socket.on('poll-started', (data: any) => {
                    assert(true, 'Received poll state upon joining correctly', '');
                    socket.disconnect();
                    resolve();
                });

                // if there's no active poll, joining won't crash but will just acknowledge.
                setTimeout(() => {
                    socket.disconnect();
                    resolve();
                }, 1000);
            });
        });

        // ---------------------------------------------------------
        // TEST 5: Full Lifecycle & Late-Join Timer Sync
        // ---------------------------------------------------------
        console.log('\n--- Phase 5: Timer Sync & Full Poll Lifecycle ---');

        await new Promise<void>((resolve) => {
            // Connect as Teacher
            const teacherSocket = io(BACKEND_URL, { reconnection: false });
            let studentSocket: ReturnType<typeof io> | null = null;

            const pollDuration = 15; // Use 15-second poll to account for network connection latency

            teacherSocket.on('connect', () => {
                teacherSocket.emit('join-as-teacher');

                // Setup timeout just in case
                const timeout = setTimeout(() => {
                    assert(false, 'Full lifecycle completion', 'Timed out waiting for poll to end');
                    teacherSocket.disconnect();
                    if (studentSocket) studentSocket.disconnect();
                    resolve();
                }, 22000);

                // 1. Create Poll
                teacherSocket.emit('create-poll', {
                    question: 'Integration Test Question',
                    options: [{ text: 'Yes', isCorrect: true }, { text: 'No', isCorrect: false }],
                    duration: pollDuration
                });
                console.log(`[ACTION] Created a ${pollDuration}-second poll.`);
            });

            // 2. Watch for poll started and test late join
            teacherSocket.on('poll-started', (data: any) => {
                if (!data.poll || activePollId === data.poll.id) return; // ignore recovery of old polls
                activePollId = data.poll.id;
                assert(data.remainingTime === pollDuration, `Teacher created poll with ${pollDuration}s duration`, `Got ${data.remainingTime}s`);

                // Wait 5 seconds, then join as a "late" student
                console.log('[ACTION] Waiting 5 seconds to simulate a late-joining student...');
                setTimeout(() => {
                    studentSocket = io(BACKEND_URL, { reconnection: false });
                    studentSocket.on('connect', () => {
                        studentSocket!.emit('join-as-student', { studentId: 'late-student-1', studentName: 'Late Joiner' });
                    });

                    // The student should receive a poll-started event with synchronized remainingTime
                    studentSocket.on('poll-started', (studentData: any) => {
                        if (!studentData.poll || studentData.poll.id !== activePollId) return;

                        const timeDiff = pollDuration - studentData.remainingTime;
                        // 5 second raw wait + roughly 1-3 seconds for socket handshakes and network
                        const diffIsReasonable = timeDiff >= 4 && timeDiff <= 10;

                        assert(diffIsReasonable,
                            `Late joiner timer sync (Joined 5s late, Server remaining: ${studentData.remainingTime}s)`,
                            `Expected remaining roughly ${pollDuration - 5}s, but got ${studentData.remainingTime}s`
                        );
                    });
                }, 5000);
            });

            // 3. Verify Poll End triggered by server timer
            teacherSocket.on('poll-ended', (data: any) => {
                if (data.pollId === activePollId) {
                    assert(true, 'Server naturally ended poll after duration elapsed', '');
                    teacherSocket.disconnect();
                    if (studentSocket) studentSocket.disconnect();
                    resolve();
                }
            });

        });

    } catch (e) {
        console.error('Unexpected setup error', e);
    }

    // ---------------------------------------------------------
    // FINAL REPORT
    // ---------------------------------------------------------
    console.log('\n======================================');
    console.log(`🎯 Test Run Completed!`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    if (failed === 0) {
        console.log('\n🎉 Your API fully complies with the resilient state recovery requirements!');
    } else {
        console.log('\n⚠️ Some tests failed. Please review the errors.');
    }
    console.log('======================================\n');
}

runTests();
