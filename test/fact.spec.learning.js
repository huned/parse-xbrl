import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { XbrlParser } from '../src/index.js';
chai.use(chaiAsPromised);

describe('fact-parse-xbrl', () => {
  it('should return the document', async () => {
    const apple10kOutput = await XbrlParser.parse('./test/sampleXbrlDocuments/xbrls/2020/aapl/xml_0.xml');
    const document = apple10kOutput.getDocument();
    expect(document).to.not.be.null;
  });

  it('should find a more elegant strategy (old)', async () => {
    const apple10kOutput = await XbrlParser.parse('./test/sampleXbrlDocuments/amazon_10k.xml');
    const contextRefs = apple10kOutput.getContexts();

    const assetsFacts = apple10kOutput.getFact('us-gaap:Assets');

    expect(assetsFacts).to.not.be.null;
  });
});
