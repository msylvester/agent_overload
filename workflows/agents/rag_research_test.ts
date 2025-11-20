import { RagResearchAgent } from './rag_research_agent';

async function runTest() {
  const TEST_QUERY = [
    'generative ai models',
    'AI SPEECH TRANSLATION',
    'Company: Delve, Description: Delve is an AI compliance startup that automates regulatory compliance'
  ];
  const RagAgent = new RagResearchAgent();

  // Connect to MongoDB before running queries
  await RagAgent.connect();

  //test the vector search (expect to see something )
  const ragResult = await RagAgent.testVectorSearch(TEST_QUERY[1]);
  console.log(`Test vector search completed with ${ragResult.length} results`);

  //SHOULD SEE RESULTS including an array of distance values
//  const results = await RagAgent.getCosineDistance(TEST_QUERY[0]);
//  console.log(`here are the results: ${JSON.stringify(results)}`);
}

runTest().catch(console.error);
