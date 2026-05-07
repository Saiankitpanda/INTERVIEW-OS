// ═══════════════════════════════════════════════════════════
// API Engine — Grok, GitHub, Supabase
// ═══════════════════════════════════════════════════════════

// Fetch Grok API Key from localStorage or use a mock
function getGrokApiKey() {
    return localStorage.getItem('grok_api_key') || '';
}

export async function callGrokAPI(systemPrompt, userMessage) {
    const apiKey = getGrokApiKey();
    if (!apiKey) {
        console.warn("No Grok API key found. Using mock response.");
        return mockGrokResponse(systemPrompt, userMessage || "");
    }

    try {
        const response = await fetch('https://api.x.ai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "grok-beta",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userMessage || "" }
                ]
            })
        });

        if (!response.ok) throw new Error(`Grok API Error: ${response.statusText}`);
        
        const data = await response.json();
        return data.choices[0].message.content;
    } catch (err) {
        console.error("Grok API call failed:", err);
        return mockGrokResponse(systemPrompt, userMessage || "");
    }
}

export async function searchGitHubFOSS(techStack) {
    const query = techStack.join('+');
    console.log(`Searching GitHub for FOSS projects matching: ${query}`);
    
    return [
        {
            name: "system-design-primer",
            repo_url: "https://github.com/donnemartin/system-design-primer",
            why: "Matches HLD and distributed systems requirement.",
            stars: 250000
        },
        {
            name: "build-your-own-x",
            repo_url: "https://github.com/codecrafters-io/build-your-own-x",
            why: "Perfect for LLD and deep tech stack understanding.",
            stars: 200000
        },
        {
            name: "awesome-take-homes",
            repo_url: "https://github.com/ashishdotme/awesome-take-homes",
            why: "Curated list of real company take-home assignments.",
            stars: 5000
        }
    ];
}

// Mock Responses for development
function mockGrokResponse(system, user) {
    if (system && system.includes("JD PARSER")) {
        return JSON.stringify({
            tech_stack_detected: ["React", "Node.js", "Redis"],
            domain: "fullstack",
            company: "TechCorp",
            signal_mode: "HLD",
            foss_projects: [
                {
                    name: "realworld",
                    repo_url: "https://github.com/gothinkster/realworld",
                    why: "Exemplary fullstack application architecture.",
                    stars: 75000
                }
            ],
            assessment: {
                takehome_readme: "# Take-Home Assessment\n\nBuild a simplified version of the RealWorld app.",
                deadline_suggestion: "48 hours",
                stretch_goals: [
                    "Implement rate limiting",
                    "Add Redis caching",
                    "Containerize with Docker"
                ],
                test_case_matrix: {
                    unit: ["Test auth reducer", "Test API service"],
                    integration: ["Test login flow", "Test feed loading"],
                    edge_cases: ["Token expiration", "Network timeout"]
                }
            },
            faang_rubric: {
                coding: "Expects clean separation of concerns.",
                lld: "SOLID principles required.",
                hld: "Must justify state management choices.",
                behavioral: "Focus on ownership of features.",
                bar_raiser: "Looking for system-level thinking."
            }
        });
    }
    
    if (system && system.includes("CODE REVIEWER")) {
        return "### Code Review Summary\n| Category | Status | Note |\n|---|---|---|\n| Complexity | WARN | O(N^2) spotted. Consider a hash map. |\n| SOLID | PASS | Good separation of concerns. |\n| Security | FAIL | Hardcoded API keys detected. |\n\n**Overall Score**: 5/10. Please refactor the nested loops and remove secrets.\n";
    }

    const safeUser = user || "";
    const shortUser = safeUser.length > 50 ? safeUser.substring(0, 50) : safeUser;
    return "This is a mocked Grok Agent response based on your input: " + shortUser + "...";
}
