//create some test data 
//import the advice_agent 
//run the test 
//
import { AdviceResponse, getAdvice } from './agents/advice'; 
:X

const TEST_DATA = { 
  {
  input: "who would invest in my ai powered shopping extension",
  expected: 2 //the investors of phia and the investors of onton,
}, 
{
  input: "who would invest in my dev tool",
  expeced: 4, 
}
}

interface ResponseItem {
  input: string;
  expected: string;
  status: boolean; 
}




async function adviceHarnes() : Promise<ResponseItem[]> {
  //loop throught the testdata, accumalite responses 
  for (let test of TEST_DATA) {
    const { input, expected } = test;
    let results = {}; 

    const result : AdviceResponse = getAdvice(input); 

    const { investors }  = result; 
    results.push({ input, expected, status: expected >= investors.length) 
       
  }
}
