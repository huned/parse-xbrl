import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import { XbrlParser } from '../src/index.js';
import { ContextRef } from '../src/classes/ContextRef.js';
chai.use(chaiAsPromised);

describe('fact-parse-xbrl', () => {
  it('should return the document', async () => {
    const apple10kOutput = await XbrlParser.parse('./test/sampleXbrlDocuments/xbrls/2020/aapl/xml_0.xml');
    console.log(apple10kOutput);
    console.log(apple10kOutput.document);
    const document = apple10kOutput.getDocument();
    expect(document).to.not.be.null;
  });

  it('should find a more elegant strategy (new)', async () => {
    const apple10kOutput = await XbrlParser.parse('./test/sampleXbrlDocuments/xbrls/2020/aapl/xml_0.xml');
    const contextRefs = new ContextRef(apple10kOutput.document).getReferences();

    const assetsFacts = apple10kOutput.getFact('us-gaap:Assets');
    assetsFacts.updateContexts(contextRefs);

    const liabilitiesFacts = apple10kOutput.getFact('us-gaap:Liabilities');
    liabilitiesFacts.updateContexts(contextRefs);

    expect(assets).to.not.be.null;
  });

  it.only('should find a more elegant strategy (old)', async () => {
    const apple10kOutput = await XbrlParser.parse('./test/sampleXbrlDocuments/amazon_10k.xml');
    const contextRefs = new ContextRef(apple10kOutput.document).getReferences();
    const contextRefs2 = apple10kOutput.getContexts().map(c => c.id);

    const assetsFacts = apple10kOutput.getFact('us-gaap:Assets');
    assetsFacts.updateContexts(contextRefs);

    const liabilitiesFacts = apple10kOutput.getFact('us-gaap:Liabilities');
    liabilitiesFacts.updateContexts(contextRefs);

    expect(assets).to.not.be.null;
  });
});
