import { expect } from 'chai';

import { XbrlParser } from '../dist/index.js';

describe('fact-parse-xbrl', function () {
  it('should return the document', async function () {
    const apple10kOutput = await XbrlParser.parse('./test/sampleXbrlDocuments/xbrls/2020/aapl/xml_0.xml');
    console.log(apple10kOutput);
    console.log(apple10kOutput.document);
    const document = apple10kOutput.getDocument();
  });

  it.only('should get a single fact with multiple contexts', async function () {
    const apple10kOutput = await XbrlParser.parse('./test/sampleXbrlDocuments/xbrls/2020/aapl/xml_0.xml');
    console.log(apple10kOutput);
    console.log(apple10kOutput.document);
    const assets = apple10kOutput.getFact('us-gaap:assets');
  });
});
