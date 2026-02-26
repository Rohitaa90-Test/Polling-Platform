import { io } from 'socket.io-client';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

async function runEdgeCaseTests() {
    console.log('🚀 Starting Extreme Edge-Case Penetration Tests...\n');

    let passed = 0;
    let failed = 0;

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
        const socket = io(BACKEND_URL, { reconnection: false });

        await new Promise<void>((resolve) => {
            socket.on('connect', () => {

                socket.emit('join-as-teacher');
                console.log('\n--- Phase 1: Security boundaries on Poll Creation ---');

                let expectedErrorsSeen = 0;

                // Listen for expected validation errors
                socket.on('error', (err: any) => {
                    if (err.message.includes('Duration must be between') ||
                        err.message.includes('Invalid question') ||
                        err.message.includes('Poll must have between')) {
                        expectedErrorsSeen++;
                    }
                });

                // 1. Attack: Malicious Payload (giant duration)
                socket.emit('create-poll', {
                    question: 'Attack Question',
                    options: [{ text: 'A', isCorrect: true }, { text: 'B', isCorrect: false }],
                    duration: 99999999 // Over the 3600 limit
                });

                // 2. Attack: Malicious Payload (Empty Options array)
                socket.emit('create-poll', {
                    question: 'No options test',
                    options: [], // Not allowed
                    duration: 30
                });

                setTimeout(() => {
                    assert(expectedErrorsSeen >= 1, 'Server rejected malicious create-poll payloads', `Expected validation errors, but saw ${expectedErrorsSeen}`);
                    resolve();
                }, 2000);
            });
        });

        socket.disconnect();

    } catch (e) {
        console.error('Unexpected setup error', e);
    }

    console.log('\n======================================');
    console.log(`🎯 Edge-Case Test Run Completed!`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log('======================================\n');
}

runEdgeCaseTests();
