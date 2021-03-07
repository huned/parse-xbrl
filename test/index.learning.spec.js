const ParseXbrl = require('../index.js');
const fs = require('fs');
const path = require('path');

describe('parse-xbrl', function (done) {
  it('Learning test', async function (done) {
    const documents = [
      './test/sampleXbrlDocuments/xbrls/2019/aapl/xml_0.xml',
      './test/sampleXbrlDocuments/xbrls/2020/aapl/xml_0.xml',
      './test/sampleXbrlDocuments/xbrls/2019/msft/xml_0.xml',
      './test/sampleXbrlDocuments/xbrls/2020/msft/xml_0.xml',
      './test/sampleXbrlDocuments/xbrls/2019/tsla/xml_0.xml',
      './test/sampleXbrlDocuments/xbrls/2020/tsla/xml_0.xml'
    ];

    for (const doc of documents) {
      try {
        const filing = await ParseXbrl.parse(doc);
        const [, , , , year, company] = doc.split('/');
        console.log({ year, company });
        await fs.promises.writeFile(
          path.dirname(doc) + path.sep + company + '_' + year + '.json',
          JSON.stringify(filing, null, 2)
        );
      } catch (ex) {
        console.error(ex);
      }
    }
    done();
  });
});
