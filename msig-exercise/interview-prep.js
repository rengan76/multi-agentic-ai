// ============================================================
// INTERVIEW PREPARATION: Quick Reference & Talking Points
// ============================================================

/*
╔══════════════════════════════════════════════════════════════╗
║  MSIG INTERVIEW - POLYGLOT DEVELOPER + AI-DRIVEN DELIVERY   ║
╠══════════════════════════════════════════════════════════════╣
║  Client: MSIG                                                ║
║  Role: Polyglot Developer with AI-focused approach           ║
║  Key: Leverage AI to REDUCE software engineering time        ║
╚══════════════════════════════════════════════════════════════╝

WHAT THEY ARE LOOKING FOR:
1. NOT traditional software engineering
2. Someone who uses AI to ACCELERATE delivery
3. Understanding of agentic AI development patterns
4. Polyglot capability (multiple languages/frameworks)
5. Can walk through nebula repos showing understanding

═══════════════════════════════════════════════════
EXERCISE 1 - ARTICLE SUMMARY (60 seconds pitch)
═══════════════════════════════════════════════════

"The article 'The Bet Behind Nebula' by Gajapathi Kannan explains how 
a REPEATED AI workflow became a DURABLE framework.

The key insight is: most developers use AI as one-off prompts that live 
in chat and get forgotten. Nebula takes the opposite approach - it turns 
those prompts into versioned, reviewable markdown contracts that can be 
reused across sessions.

The framework defines 11 agent roles, 9 actions, and validation gates 
that enforce quality. It's tool-agnostic - works with Claude, Codex, 
Copilot, anything.

The insurance CRM is the proving ground - complex enough to expose when 
the framework's assumptions are wrong. Most AI failures in real systems 
aren't syntax errors - they're COORDINATION failures: the endpoint exists 
but the schema doesn't match, the UI renders but the role boundary is wrong.

Nebula treats that as a framework problem, not a developer cleanup problem."

═══════════════════════════════════════════════════
EXERCISE 2 - REPO WALKTHROUGH (key points)
═══════════════════════════════════════════════════

nebula-agents (Framework):
- 11 agents: PM, Architect, Backend, Frontend, AI Engineer, QE, DevOps, 
  Code Reviewer, Security, Tech Writer, Blogger
- 9 actions: init, plan, build, feature, review, validate, test, document, blog
- Plain markdown contracts (SKILL.md per role)
- Python validators for genericness, templates, skills
- Docker builder runtime

nebula-insurance-crm (Product):
- C# .NET backend (engine/)
- React + TypeScript frontend (experience/)
- Python AI layer (neuron/)
- PostgreSQL + Authentik
- Full planning structure (BLUEPRINT.md, features/, knowledge-graph/)
- Real insurance domain: P&C, brokers, policies, claims

Relationship:
- Framework sits NEXT TO product (sibling repos)
- No SDK, no coupling, just markdown telling AI how to work
- Session starts in agents/, implements into product/

═══════════════════════════════════════════════════
YOUR EXPERIENCE MAPPED TO NEBULA CONCEPTS
═══════════════════════════════════════════════════

Your Experience → Nebula Concept:
• Azure OpenAI + Figma parser → AI Engineer agent (LLM automation)
• BDD artifact generation → Quality Engineer agent (test automation)
• MCP workflows → AI runtime layer (neuron/)
• Python/Node.js/React → Polyglot product stack
• Enterprise integration → Backend developer agent
• Healthcare workflow automation → Maps to insurance workflow complexity
• SDLC optimization → Core value prop of the whole framework

═══════════════════════════════════════════════════
GAPS & HOW TO CLOSE THEM
═══════════════════════════════════════════════════

1. C# .NET (their backend is C#)
   → "I'm comfortable picking up C# - my Node.js API patterns transfer 
      directly. The framework is language-agnostic anyway."

2. Insurance domain
   → "I've reviewed the glossary and BLUEPRINT. The domain concepts 
      (policy lifecycle, endorsements, submissions) map to healthcare 
      workflow patterns I've built."

3. Multi-agent orchestration
   → "I've built AI pipelines with MCP and Azure OpenAI. Nebula's 
      approach is simpler - it's markdown contracts that any AI tool 
      can follow. No runtime orchestrator needed."

═══════════════════════════════════════════════════
QUESTIONS YOU MIGHT GET & ANSWERS
═══════════════════════════════════════════════════

Q: "How would you use AI to speed up development?"
A: "Instead of writing code from scratch, I define the feature through 
    structured planning (stories, acceptance criteria, screen contracts), 
    then use AI with role-specific prompts to generate implementation 
    that's validated against those contracts."

Q: "What's the difference between using ChatGPT and agentic development?"
A: "ChatGPT is a single conversation. Agentic development is a SYSTEM - 
    multiple specialized agents with clear ownership boundaries, gates 
    that prevent drift, and artifacts that persist between sessions."

Q: "How do you handle when AI generates wrong code?"
A: "That's exactly what validation gates solve. The framework doesn't 
    trust AI output blindly - it validates against domain contracts, 
    API specs, and test coverage before allowing work to proceed."

Q: "What's your approach to a new feature?"
A: "Plan first (PM defines WHAT), then design (Architect defines HOW), 
    then implement (Backend + Frontend in parallel), then validate 
    (QA + Security + Review). Each transition has a gate."

Q: "How does this reduce engineering time?"
A: "The framework eliminates re-teaching. Instead of spending 30 minutes 
    per session explaining context and constraints to AI, the contracts 
    carry that knowledge. AI reads SKILL.md and knows its boundaries."
*/

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║  INTERVIEW PREP - RUN THE FILES IN ORDER:                   ║");
console.log("╠══════════════════════════════════════════════════════════════╣");
console.log("║                                                              ║");
console.log("║  1. node exercise1-nebula-concepts.js                        ║");
console.log("║     → Understand the article concepts                        ║");
console.log("║                                                              ║");
console.log("║  2. node exercise2-repo-walkthrough.js                       ║");
console.log("║     → Understand both repos + gap analysis                   ║");
console.log("║                                                              ║");
console.log("║  3. node exercise2-sample-agent-code.js                      ║");
console.log("║     → Demo code showing you can BUILD these patterns         ║");
console.log("║                                                              ║");
console.log("║  4. Read this file (interview-prep.js) for talking points    ║");
console.log("║                                                              ║");
console.log("╚══════════════════════════════════════════════════════════════╝");
console.log("\nGood luck with the interview! 🚀");
