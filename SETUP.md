# AI Agents Collaboration - Setup Instructions

## Requirements

- Node.js 18+ 
- npm or yarn
- OpenAI API key

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set environment variables:**
   
   Create a `.env.local` file in the root directory and add your OpenAI API key:
   ```bash
   # .env.local
   OPENAI_API_KEY=your_openai_api_key_here
   ```
   
   You can get your API key from: https://platform.openai.com/api-keys

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open the application:**
   
   Go to [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### 1. Create AI Agents

1. Go to "Manage Agents" from the homepage.
2. Fill in the form with a description of your desired agent.
3. For example: "Create an agent that is an expert in writing blog posts about technology."
4. Click on "Create Agent".

### 2. Let Agents Collaborate

1. Go to "Collaborate" from the homepage.
2. Select multiple agents you want to collaborate.
3. Give your collaboration a name and description.
4. Click "Start Collaboration".
5. Use the chat interface to give commands to your agents.

### 3. Example Commands

- "Write a blog post about print-on-demand and sustainability"
- "Create a marketing plan for a new SaaS startup"
- "Analyze the pros and cons of remote work"
- "Develop a content strategy for social media"

## Technical Details

### File System Storage

The application stores agents and collaborations on the local file system:
- `data/agents/` - Agent definitions (JSON files)
- `data/collaborations/` - Collaboration history (JSON files)

### Server Actions

The project uses modern Next.js Server Actions instead of API routes for better performance and type safety.

### Multi-Agent Communication

Agents communicate by:
1. Providing context from previous messages.
2. Sharing responses from other agents.
3. A facilitator system that coordinates the collaboration.

## Troubleshooting

### "Failed to create agent" error
- Check if your OpenAI API key is set correctly in `.env.local`.
- Make sure your API key is valid and has credit.

### Agents are not responding
- Check the browser console for errors.
- Refresh the page and try again.
- Check if your internet connection is stable.

### File system errors
- Make sure the application has write permissions in the project directory.
- The `data/` directory is created automatically on first use.

## Development

For development, you can use the following commands:

```bash
# Development server with turbopack
npm run dev

# Type checking
npm run build

# Linting
npm run lint
```

## Architecture

```
src/
├── app/                 # Next.js App Router pages
├── components/          # React components
├── lib/
│   ├── actions/        # Server Actions
│   ├── aiService.ts    # OpenAI integration
│   └── fileSystem.ts   # File storage utilities
└── types/              # TypeScript type definitions
```

## License

MIT
