import { expect } from 'chai';

import { XbrlParser } from '../dist/index.js';

describe('fact-parse-xbrl', function () {
  it('should parse the xbrl for AAPL 10k 2020', async function () {
    const apple10kOutput = await XbrlParser.parse('./test/sampleXbrlDocuments/xbrls/2020/aapl/xml_0.xml');
    console.log(apple10kOutput);
    console.log(apple10kOutput.document);
    const document = apple10kOutput.getDocument();
    console.log(document);

    const assetsFacts = apple10kOutput.getFacts('us-gaap:assets', document);
  });
});
