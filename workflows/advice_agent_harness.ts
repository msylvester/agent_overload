//create some test data 
//import the advice_agent 
//run the test 
//
import { AdviceResponse, getAdvice } from './agents/advice_agent'; 

const TEST_DATA = [
  {
  input: "who would invest in my ai powered shopping extension",
  expected: 2 //the investors of phia and the investors of onton,
},
{
  input: "who would invest in my dev tool",
  expected: 4,
}
]

interface ResponseItem {
  input: string;
  expected: number;
  status: boolean;
}




async function adviceHarness() : Promise<ResponseItem[]> {
  //loop through the testdata, accumulate responses
  const results: ResponseItem[] = [];

  for (let test of TEST_DATA) {
    const { input, expected } = test;

    const result : AdviceResponse = await getAdvice(input);

    const { investors }  = result;
    results.push({ input, expected, status: expected >= investors.length });
  }

  return results;
}
