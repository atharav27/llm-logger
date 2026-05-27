-- Groq decommissioned deepseek-r1-distill-llama-70b; remap to default Groq model
UPDATE conversations
SET provider = 'GROQ',
    model = 'llama-3.3-70b-versatile'
WHERE model = 'deepseek-r1-distill-llama-70b';
