import { promises as fs, readFileSync } from 'fs';
import { dirname, sep } from 'path';
import { toJson } from 'xml2json';
import { parse } from '../dist/index.js';

const { tsla10K2020Parsed, aapl10K2020Parsed } = loadData();

describe('parse-xbrl', function () {
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
        const filing = await parse(doc);
        const [, , , , year, company] = doc.split('/');
        console.log({ year, company });
        await fs.writeFile(dirname(doc) + sep + company + '_' + year + '.json', JSON.stringify(filing, null, 2));
      } catch (ex) {
        console.error(ex);
      }
    }
    done();
  });

  it('should parse the xbrl for AAPL 10k 2020', async function (done) {
    const apple10kOutput = await parse('./test/sampleXbrlDocuments/xbrls/2020/aapl/xml_0.xml');
    for (var key in apple10kOutput) {
      if (aapl10K2020Parsed[key]) {
        expect(apple10kOutput[key]).toBe(aapl10K2020Parsed[key]);
      }
    }
    done();
  });

  it('should parse the xbrl for TSLA 10k 2020', function (done) {
    const tsla10kOutput = parse('./test/sampleXbrlDocuments/xbrls/2020/tsla/xml_0.xml');
    tsla10kOutput.then(r => {
      for (var key in r) {
        if (tsla10K2020Parsed[key]) {
          expect(r[key]).toBe(tsla10K2020Parsed[key]);
        }
      }
      done();
    });
  });

  it('should parse new documents', function (done) {
    var newmsft = parse('./test/sampleXbrlDocuments/new_documents/xml_0.xml');

    newmsft.then(resolve => {
      expect(resolve['EntityRegistrantName']).toBe('MICROSOFT CORPORATION');

      done();
    });
  });

  it('can load EntityRegistrantName', function (done) {
    const oldData = readFileSync('./test/sampleXbrlDocuments/ruby_tuesday_10q.xml', 'utf8');
    const newData = readFileSync('./test/sampleXbrlDocuments/new_documents/xml_0.xml', 'utf8');

    const oldJsonObj = JSON.parse(toJson(oldData));
    const newJsonObj = JSON.parse(toJson(newData));

    const newO = {};
    const oldO = {};

    oldO.documentJson = oldJsonObj[Object.keys(oldJsonObj)[0]];
    newO.documentJson = newJsonObj[Object.keys(newJsonObj)[0]];

    oldO.fields = {};
    newO.fields = {};

    newO.loadField = loadField.bind(newO);
    oldO.loadField = loadField.bind(oldO);

    oldO.loadField('EntityRegistrantName');
    newO.loadField('EntityRegistrantName');

    oldO.loadField('CurrentFiscalYearEndDate');
    newO.loadField('CurrentFiscalYearEndDate');

    oldO.loadField('EntityCentralIndexKey');
    newO.loadField('EntityCentralIndexKey');

    oldO.loadField('EntityFilerCategory');
    newO.loadField('EntityFilerCategory');

    oldO.loadField('TradingSymbol');
    newO.loadField('TradingSymbol');

    oldO.loadField('DocumentPeriodEndDate');
    newO.loadField('DocumentPeriodEndDate');

    oldO.loadField('DocumentFiscalYearFocus');
    newO.loadField('DocumentFiscalYearFocus');

    oldO.loadField('DocumentFiscalPeriodFocus');
    newO.loadField('DocumentFiscalPeriodFocus');

    oldO.loadField('DocumentFiscalYearFocus', 'DocumentFiscalYearFocusContext', 'contextRef');
    newO.loadField('DocumentFiscalYearFocus', 'DocumentFiscalYearFocusContext', 'contextRef');

    oldO.loadField('DocumentFiscalPeriodFocus', 'DocumentFiscalPeriodFocusContext', 'contextRef');
    newO.loadField('DocumentFiscalPeriodFocus', 'DocumentFiscalPeriodFocusContext', 'contextRef');

    for (let key in newO.fields) {
      console.log(`\n ${key} differences:\n old: ${oldO.fields[key]}  \n new:${newO.fields[key]}`);
    }

    expect(newO.fields.EntityRegistrantName).toBe('MICROSOFT CORPORATION');
    expect(/--\d\d-\d\d/.test(newO.fields.CurrentFiscalYearEndDate)).toBeTrue;
    done();
  });
});

function loadData() {
  const tsla10K2020Parsed = {
    TotalRevenue: 6036000,
    OperatingRevenue: 6036000,
    CostofRevenue: 4769000,
    GrossProfit: 1267000,
    OperatingExpense: 940000,
    OperatingIncome: 327000,
    NetNonOperatingInterestIncomeExpense: -162000,
    OtherIncomeExpense: -15000,
    PretaxIncome: 150000,
    TaxProvision: 21000,
    NetIncomeCommonStockholders: 104000,
    DilutedNIAvailabletoComStockholders: 104000,
    BasicEPS: 0,
    DilutedEPS: 0,
    BasicAverageShares: 930000,
    DilutedAverageShares: 1035000,
    TotalOperatingIncomeasReported: 327000,
    TotalExpenses: 5709000,
    'NetIncomefromContinuing&DiscontinuedOperation': 104000,
    NormalizedIncome: 104000,
    InterestIncome: 8000,
    InterestExpense: 170000,
    NetInterestIncome: -162000,
    EBIT: 320000,
    EBITDA: null,
    ReconciledCostofRevenue: 4769000,
    ReconciledDepreciation: 567000,
    NetIncomefromContinuingOperationNetMinorityInterest: 104000,
    TotalUnusualItemsExcludingGoodwill: 0,
    TotalUnusualItems: 0,
    NormalizedEBITDA: 887000,
    TaxRateforCalcs: 0,
    TaxEffectofUnusualItems: 0,
    TotalAssets: 38135000,
    CurrentAssets: 15336000,
    'Totalnon-currentassets': 22799000,
    TotalLiabilitiesNetMinorityInterest: 27411000,
    CurrentLiabilities: 12270000,
    TotalNonCurrentLiabilitiesNetMinorityInterest: 15141000,
    TotalEquityGrossMinorityInterest: 10724000,
    "Stockholders'Equity": 9855000,
    MinorityInterest: 869000,
    TotalCapitalization: 19146000,
    CommonStockEquity: 9855000,
    CapitalLeaseObligations: 2869000,
    NetTangibleAssets: 9347000,
    WorkingCapital: 3066000,
    InvestedCapital: 22463000,
    TangibleBookValue: 9347000,
    TotalDebt: 15477000,
    NetDebt: 3993000,
    ShareIssued: 931596,
    OrdinarySharesNumber: 931596,
    OperatingCashFlow: 964000,
    CashFlowfromContinuingOperatingActivities: 964000,
    InvestingCashFlow: -566000,
    CashFlowfromContinuingInvestingActivities: -566000,
    FinancingCashFlow: 123000,
    CashFlowfromContinuingFinancingActivities: 123000,
    EndCashPosition: 9106000,
    ChangesinCash: 521000,
    EffectofExchangeRateChanges: 38000,
    BeginningCashPosition: 8547000,
    IncomeTaxPaidSupplementalData: null,
    InterestPaidSupplementalData: null,
    CapitalExpenditure: -566000,
    IssuanceofCapitalStock: 0,
    IssuanceofDebt: 2144000,
    RepaymentofDebt: -2033000,
    FreeCashFlow: 398000
  };

  const aapl10K2020Parsed = {
    TotalRevenue: 59685000,
    OperatingRevenue: 59685000,
    CostofRevenue: 37005000,
    GrossProfit: 22680000,
    OperatingExpense: 9589000,
    OperatingIncome: 13091000,
    NetNonOperatingInterestIncomeExpense: 204000,
    OtherIncomeExpense: -158000,
    PretaxIncome: 13137000,
    TaxProvision: 1884000,
    NetIncomeCommonStockholders: 11253000,
    DilutedNIAvailabletoComStockholders: 11253000,
    BasicEPS: 0,
    DilutedEPS: 0,
    BasicAverageShares: 17250292,
    DilutedAverageShares: 17419152,
    TotalOperatingIncomeasReported: 13091000,
    TotalExpenses: 46594000,
    'NetIncomefromContinuing&DiscontinuedOperation': 11253000,
    NormalizedIncome: 11253000,
    InterestIncome: 901000,
    InterestExpense: 697000,
    NetInterestIncome: 204000,
    EBIT: 13834000,
    EBITDA: null,
    ReconciledCostofRevenue: 37005000,
    ReconciledDepreciation: 2752000,
    NetIncomefromContinuingOperationNetMinorityInterest: 11253000,
    NormalizedEBITDA: 16586000,
    TaxRateforCalcs: 0,
    TaxEffectofUnusualItems: 0,
    TotalAssets: 317344000,
    CurrentAssets: 140065000,
    'Totalnon-currentassets': 177279000,
    TotalLiabilitiesNetMinorityInterest: 245062000,
    CurrentLiabilities: 95318000,
    TotalNonCurrentLiabilitiesNetMinorityInterest: 149744000,
    TotalEquityGrossMinorityInterest: 72282000,
    "Stockholders'Equity": 72282000,
    TotalCapitalization: 166330000,
    CommonStockEquity: 72282000,
    NetTangibleAssets: 72282000,
    WorkingCapital: 44747000,
    InvestedCapital: 185005000,
    TangibleBookValue: 72282000,
    TotalDebt: 112723000,
    NetDebt: 79340000,
    ShareIssued: 17135756,
    OrdinarySharesNumber: 17135756,
    OperatingCashFlow: 16271000,
    CashFlowfromContinuingOperatingActivities: 16271000,
    InvestingCashFlow: -5165000,
    CashFlowfromContinuingInvestingActivities: -5165000,
    FinancingCashFlow: -19116000,
    CashFlowfromContinuingFinancingActivities: -19116000,
    EndCashPosition: 35039000,
    ChangesinCash: -8010000,
    BeginningCashPosition: 43049000,
    IncomeTaxPaidSupplementalData: 905000,
    InterestPaidSupplementalData: 586000,
    CapitalExpenditure: -1565000,
    IssuanceofCapitalStock: 0,
    IssuanceofDebt: 9547000,
    RepaymentofDebt: -7379000,
    RepurchaseofCapitalStock: -15891000,
    FreeCashFlow: 14706000
  };

  return {
    aapl10K2020Parsed,
    tsla10K2020Parsed
  };
}
