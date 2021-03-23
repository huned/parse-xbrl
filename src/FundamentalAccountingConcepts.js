export function loadFundamentalAccountingConcepts(xbrl) {
  // Assets
  xbrl.fields['Assets'] = xbrl.getFactValue('us-gaap:Assets', 'Instant') || 0;

  // Current Assets
  xbrl.fields['CurrentAssets'] =
    xbrl.getFactValue('us-gaap:AssetsCurrent', 'Instant') || 0;

  // Noncurrent Assets
  xbrl.fields['NoncurrentAssets'] = xbrl.getFactValue(
    'us-gaap:AssetsNoncurrent',
    'Instant'
  );
  if (xbrl.fields['NoncurrentAssets'] === null) {
    if (xbrl.fields['Assets'] && xbrl.fields['CurrentAssets']) {
      xbrl.fields['NoncurrentAssets'] =
        xbrl.fields['Assets'] - xbrl.fields['CurrentAssets'];
    } else {
      xbrl.fields['NoncurrentAssets'] = 0;
    }
  }

  // LiabilitiesAndEquity
  xbrl.fields['LiabilitiesAndEquity'] = xbrl.getFactValue(
    'us-gaap:LiabilitiesAndStockholdersEquity',
    'Instant'
  );
  if (xbrl.fields['LiabilitiesAndEquity'] === null) {
    xbrl.fields['LiabilitiesAndEquity'] = xbrl.getFactValue(
      'us-gaap:LiabilitiesAndPartnersCapital',
      'Instant'
    );
    if (xbrl.fields['LiabilitiesAndEquity']) {
      xbrl.fields['LiabilitiesAndEquity'] = 0;
    }
  }

  // Liabilities
  xbrl.fields['Liabilities'] =
    xbrl.getFactValue('us-gaap:Liabilities', 'Instant') || 0;

  // CurrentLiabilities
  xbrl.fields['CurrentLiabilities'] =
    xbrl.getFactValue('us-gaap:LiabilitiesCurrent', 'Instant') || 0;

  // Noncurrent Liabilities
  xbrl.fields['NoncurrentLiabilities'] = xbrl.getFactValue(
    'us-gaap:LiabilitiesNoncurrent',
    'Instant'
  );
  if (xbrl.fields['NoncurrentLiabilities'] === null) {
    if (xbrl.fields['Liabilities'] && xbrl.fields['CurrentLiabilities']) {
      xbrl.fields['NoncurrentLiabilities'] =
        xbrl.fields['Liabilities'] - xbrl.fields['CurrentLiabilities'];
    } else {
      xbrl.fields['NoncurrentLiabilities'] = 0;
    }
  }

  // CommitmentsAndContingencies
  xbrl.fields['CommitmentsAndContingencies'] =
    xbrl.getFactValue('us-gaap:CommitmentsAndContingencies', 'Instant') || 0;

  // TemporaryEquity
  xbrl.fields['TemporaryEquity'] =
    xbrl.getFactValue('us-gaap:TemporaryEquityRedemptionValue', 'Instant') ||
    xbrl.getFactValue(
      'us-gaap:RedeemablePreferredStockCarryingAmount',
      'Instant'
    ) ||
    xbrl.getFactValue('us-gaap:TemporaryEquityCarryingAmount', 'Instant') ||
    xbrl.getFactValue(
      'us-gaap:TemporaryEquityValueExcludingAdditionalPaidInCapital',
      'Instant'
    ) ||
    xbrl.getFactValue(
      'us-gaap:TemporaryEquityCarryingAmountAttributableToParent',
      'Instant'
    ) ||
    xbrl.getFactValue(
      'us-gaap:RedeemableNoncontrollingInterestEquityFairValue',
      'Instant'
    ) ||
    0;

  // RedeemableNoncontrollingInterest (added to temporary equity)
  var redeemableNoncontrollingInterest =
    xbrl.getFactValue(
      'us-gaap:RedeemableNoncontrollingInterestEquityCarryingAmount',
      'Instant'
    ) ||
    xbrl.getFactValue(
      'us-gaap:RedeemableNoncontrollingInterestEquityCommonCarryingAmount',
      'Instant'
    ) ||
    0;

  // This adds redeemable noncontrolling interest and temporary equity which are rare, but can be reported separately
  if (xbrl.fields['TemporaryEquity']) {
    xbrl.fields['TemporaryEquity'] =
      Number(xbrl.fields['TemporaryEquity']) +
      Number(redeemableNoncontrollingInterest);
  }

  // Equity
  xbrl.fields['Equity'] =
    xbrl.getFactValue(
      'us-gaap:StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
      'Instant'
    ) ||
    xbrl.getFactValue('us-gaap:StockholdersEquity', 'Instant') ||
    xbrl.getFactValue(
      'us-gaap:PartnersCapitalIncludingPortionAttributableToNoncontrollingInterest',
      'Instant'
    ) ||
    xbrl.getFactValue('us-gaap:PartnersCapital', 'Instant') ||
    xbrl.getFactValue('us-gaap:CommonStockholdersEquity', 'Instant') ||
    xbrl.getFactValue('us-gaap:MemberEquity', 'Instant') ||
    xbrl.getFactValue('us-gaap:AssetsNet', 'Instant') ||
    0;

  // EquityAttributableToNoncontrollingInterest
  xbrl.fields['EquityAttributableToNoncontrollingInterest'] =
    xbrl.getFactValue('us-gaap:MinorityInterest', 'Instant') ||
    xbrl.getFactValue(
      'us-gaap:PartnersCapitalAttributableToNoncontrollingInterest',
      'Instant'
    ) ||
    0;

  // EquityAttributableToParent
  xbrl.fields['EquityAttributableToParent'] =
    xbrl.getFactValue('us-gaap:StockholdersEquity', 'Instant') ||
    xbrl.getFactValue('us-gaap:LiabilitiesAndPartnersCapital', 'Instant') ||
    0;

  // BS Adjustments
  // If total assets is missing, try using current assets
  if (
    xbrl.fields['Assets'] === 0 &&
    xbrl.fields['Assets'] === xbrl.fields['LiabilitiesAndEquity'] &&
    xbrl.fields['CurrentAssets'] === xbrl.fields['LiabilitiesAndEquity']
  ) {
    xbrl.fields['Assets'] = xbrl.fields['CurrentAssets'];
  }

  // Added to fix Assets
  if (
    xbrl.fields['Assets'] === 0 &&
    xbrl.fields['LiabilitiesAndEquity'] !== 0 &&
    xbrl.fields['CurrentAssets'] === xbrl.fields['LiabilitiesAndEquity']
  ) {
    xbrl.fields['Assets'] = xbrl.fields['CurrentAssets'];
  }

  // Added to fix Assets even more
  if (
    xbrl.fields['Assets'] === 0 &&
    xbrl.fields['NoncurrentAssets'] === 0 &&
    xbrl.fields['LiabilitiesAndEquity'] !== 0 &&
    xbrl.fields['LiabilitiesAndEquity'] ===
      xbrl.fields['Liabilities'] + xbrl.fields['Equity']
  ) {
    xbrl.fields['Assets'] = xbrl.fields['CurrentAssets'];
  }

  if (xbrl.fields['Assets'] !== 0 && xbrl.fields['CurrentAssets'] !== 0) {
    xbrl.fields['NoncurrentAssets'] =
      xbrl.fields['Assets'] - xbrl.fields['CurrentAssets'];
  }

  if (
    xbrl.fields['LiabilitiesAndEquity'] === 0 &&
    xbrl.fields['Assets'] !== 0
  ) {
    xbrl.fields['LiabilitiesAndEquity'] = xbrl.fields['Assets'];
  }

  // Impute: Equity based no parent and noncontrolling interest being present
  if (
    xbrl.fields['EquityAttributableToNoncontrollingInterest'] !== 0 &&
    xbrl.fields['EquityAttributableToParent'] !== 0
  ) {
    xbrl.fields['Equity'] =
      xbrl.fields['EquityAttributableToParent'] +
      xbrl.fields['EquityAttributableToNoncontrollingInterest'];
  }

  if (
    xbrl.fields['Equity'] === 0 &&
    xbrl.fields['EquityAttributableToNoncontrollingInterest'] === 0 &&
    xbrl.fields['EquityAttributableToParent'] !== 0
  ) {
    xbrl.fields['Equity'] = xbrl.fields['EquityAttributableToParent'];
  }

  if (xbrl.fields['Equity'] === 0) {
    xbrl.fields['Equity'] =
      xbrl.fields['EquityAttributableToParent'] +
      xbrl.fields['EquityAttributableToNoncontrollingInterest'];
  }

  // Added: Impute Equity attributable to parent based on existence of equity and noncontrolling interest.
  if (
    xbrl.fields['Equity'] !== 0 &&
    xbrl.fields['EquityAttributableToNoncontrollingInterest'] !== 0 &&
    xbrl.fields['EquityAttributableToParent'] === 0
  ) {
    xbrl.fields['EquityAttributableToParent'] =
      xbrl.fields['Equity'] -
      xbrl.fields['EquityAttributableToNoncontrollingInterest'];
  }

  // Added: Impute Equity attributable to parent based on existence of equity and noncontrolling interest.
  if (
    xbrl.fields['Equity'] !== 0 &&
    xbrl.fields['EquityAttributableToNoncontrollingInterest'] === 0 &&
    xbrl.fields['EquityAttributableToParent'] === 0
  ) {
    xbrl.fields['EquityAttributableToParent'] = xbrl.fields['Equity'];
  }

  // if total liabilities is missing, figure it out based on liabilities and equity
  if (xbrl.fields['Liabilities'] === 0 && xbrl.fields['Equity'] !== 0) {
    xbrl.fields['Liabilities'] =
      xbrl.fields['LiabilitiesAndEquity'] -
      (xbrl.fields['CommitmentsAndContingencies'] +
        xbrl.fields['TemporaryEquity'] +
        xbrl.fields['Equity']);
  }

  // This seems incorrect because liabilities might not be reported
  if (
    xbrl.fields['Liabilities'] !== 0 &&
    xbrl.fields['CurrentLiabilities'] !== 0
  ) {
    xbrl.fields['NoncurrentLiabilities'] =
      xbrl.fields['Liabilities'] - xbrl.fields['CurrentLiabilities'];
  }

  // Added to fix liabilities based on current liabilities
  if (
    xbrl.fields['Liabilities'] === 0 &&
    xbrl.fields['CurrentLiabilities'] !== 0 &&
    xbrl.fields['NoncurrentLiabilities'] === 0
  ) {
    xbrl.fields['Liabilities'] = xbrl.fields['CurrentLiabilities'];
  }

  // Revenues
  xbrl.fields['Revenues'] =
    xbrl.getFactValue('us-gaap:Revenues', 'Duration') ||
    xbrl.getFactValue('us-gaap:SalesRevenueNet', 'Duration') ||
    xbrl.getFactValue('us-gaap:SalesRevenueServicesNet', 'Duration') ||
    xbrl.getFactValue('us-gaap:RevenuesNetOfInterestExpense', 'Duration') ||
    xbrl.getFactValue(
      'us-gaap:RegulatedAndUnregulatedOperatingRevenue',
      'Duration'
    ) ||
    xbrl.getFactValue('us-gaap:HealthCareOrganizationRevenue', 'Duration') ||
    xbrl.getFactValue(
      'us-gaap:InterestAndDividendIncomeOperating',
      'Duration'
    ) ||
    xbrl.getFactValue('us-gaap:RealEstateRevenueNet', 'Duration') ||
    xbrl.getFactValue('us-gaap:RevenueMineralSales', 'Duration') ||
    xbrl.getFactValue('us-gaap:OilAndGasRevenue', 'Duration') ||
    xbrl.getFactValue('us-gaap:FinancialServicesRevenue', 'Duration') ||
    xbrl.getFactValue(
      'us-gaap:RegulatedAndUnregulatedOperatingRevenue',
      'Duration'
    ) ||
    0;

  // CostOfRevenue
  xbrl.fields['CostOfRevenue'] =
    xbrl.getFactValue('us-gaap:CostOfRevenue', 'Duration') ||
    xbrl.getFactValue('us-gaap:CostOfServices', 'Duration') ||
    xbrl.getFactValue('us-gaap:CostOfGoodsSold', 'Duration') ||
    xbrl.getFactValue('us-gaap:CostOfGoodsAndServicesSold', 'Duration') ||
    0;

  // GrossProfit
  xbrl.fields['GrossProfit'] =
    xbrl.getFactValue('us-gaap:GrossProfit', 'Duration') ||
    xbrl.getFactValue('us-gaap:GrossProfit', 'Duration') ||
    0;

  // OperatingExpenses
  xbrl.fields['OperatingExpenses'] =
    xbrl.getFactValue('us-gaap:OperatingExpenses', 'Duration') ||
    xbrl.getFactValue('us-gaap:OperatingCostsAndExpenses', 'Duration') ||
    0;

  // CostsAndExpenses
  xbrl.fields['CostsAndExpenses'] =
    xbrl.getFactValue('us-gaap:CostsAndExpenses', 'Duration') ||
    xbrl.getFactValue('us-gaap:CostsAndExpenses', 'Duration') ||
    0;

  // OtherOperatingIncome
  xbrl.fields['OtherOperatingIncome'] =
    xbrl.getFactValue('us-gaap:OtherOperatingIncome', 'Duration') ||
    xbrl.getFactValue('us-gaap:OtherOperatingIncome', 'Duration') ||
    0;

  // OperatingIncomeLoss
  xbrl.fields['OperatingIncomeLoss'] =
    xbrl.getFactValue('us-gaap:OperatingIncomeLoss', 'Duration') ||
    xbrl.getFactValue('us-gaap:OperatingIncomeLoss', 'Duration') ||
    0;

  // NonoperatingIncomeLoss
  xbrl.fields['NonoperatingIncomeLoss'] =
    xbrl.getFactValue('us-gaap:NonoperatingIncomeExpense', 'Duration') ||
    xbrl.getFactValue('us-gaap:NonoperatingIncomeExpense', 'Duration') ||
    0;

  // InterestAndDebtExpense
  xbrl.fields['InterestAndDebtExpense'] =
    xbrl.getFactValue('us-gaap:InterestAndDebtExpense', 'Duration') ||
    xbrl.getFactValue('us-gaap:InterestAndDebtExpense', 'Duration') ||
    0;

  // IncomeBeforeEquityMethodInvestments
  xbrl.fields['IncomeBeforeEquityMethodInvestments'] =
    xbrl.getFactValue(
      'us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments',
      'Duration'
    ) ||
    xbrl.getFactValue(
      'us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments',
      'Duration'
    ) ||
    0;

  // IncomeFromEquityMethodInvestments
  xbrl.fields['IncomeFromEquityMethodInvestments'] =
    xbrl.getFactValue(
      'us-gaap:IncomeLossFromEquityMethodInvestments',
      'Duration'
    ) ||
    xbrl.getFactValue(
      'us-gaap:IncomeLossFromEquityMethodInvestments',
      'Duration'
    ) ||
    0;

  // IncomeFromContinuingOperationsBeforeTax
  xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] =
    xbrl.getFactValue(
      'us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesMinorityInterestAndIncomeLossFromEquityMethodInvestments',
      'Duration'
    ) ||
    xbrl.getFactValue(
      'us-gaap:IncomeLossFromContinuingOperationsBeforeIncomeTaxesExtraordinaryItemsNoncontrollingInterest',
      'Duration'
    ) ||
    0;

  // IncomeTaxExpenseBenefit
  xbrl.fields['IncomeTaxExpenseBenefit'] =
    xbrl.getFactValue('us-gaap:IncomeTaxExpenseBenefit', 'Duration') ||
    xbrl.getFactValue(
      'us-gaap:IncomeTaxExpenseBenefitContinuingOperations',
      'Duration'
    ) ||
    0;

  // IncomeFromContinuingOperationsAfterTax
  xbrl.fields['IncomeFromContinuingOperationsAfterTax'] =
    xbrl.getFactValue(
      'us-gaap:IncomeLossBeforeExtraordinaryItemsAndCumulativeEffectOfChangeInAccountingPrinciple',
      'Duration'
    ) ||
    xbrl.getFactValue(
      'us-gaap:IncomeLossBeforeExtraordinaryItemsAndCumulativeEffectOfChangeInAccountingPrinciple',
      'Duration'
    ) ||
    0;

  // IncomeFromDiscontinuedOperations
  xbrl.fields['IncomeFromDiscontinuedOperations'] =
    xbrl.getFactValue(
      'us-gaap:IncomeLossFromDiscontinuedOperationsNetOfTax',
      'Duration'
    ) ||
    xbrl.getFactValue(
      'us-gaap:DiscontinuedOperationGainLossOnDisposalOfDiscontinuedOperationNetOfTax',
      'Duration'
    ) ||
    xbrl.getFactValue(
      'us-gaap:IncomeLossFromDiscontinuedOperationsNetOfTaxAttributableToReportingEntity',
      'Duration'
    ) ||
    0;

  // ExtraordaryItemsGainLoss
  xbrl.fields['ExtraordaryItemsGainLoss'] =
    xbrl.getFactValue('us-gaap:ExtraordinaryItemNetOfTax', 'Duration') ||
    xbrl.getFactValue('us-gaap:ExtraordinaryItemNetOfTax', 'Duration') ||
    0;

  // NetIncomeLoss
  xbrl.fields['NetIncomeLoss'] =
    xbrl.getFactValue('us-gaap:ProfitLoss', 'Duration') ||
    xbrl.getFactValue('us-gaap:NetIncomeLoss', 'Duration') ||
    xbrl.getFactValue(
      'us-gaap:NetIncomeLossAvailableToCommonStockholdersBasic',
      'Duration'
    ) ||
    xbrl.getFactValue(
      'us-gaap:IncomeLossFromContinuingOperations',
      'Duration'
    ) ||
    xbrl.getFactValue('us-gaap:IncomeLossAttributableToParent', 'Duration') ||
    xbrl.getFactValue(
      'us-gaap:IncomeLossFromContinuingOperationsIncludingPortionAttributableToNoncontrollingInterest',
      'Duration'
    ) ||
    0;

  // NetIncomeAvailableToCommonStockholdersBasic
  xbrl.fields['NetIncomeAvailableToCommonStockholdersBasic'] =
    xbrl.getFactValue(
      'us-gaap:NetIncomeLossAvailableToCommonStockholdersBasic',
      'Duration'
    ) || 0;

  // #PreferredStockDividendsAndOtherAdjustments
  xbrl.fields['PreferredStockDividendsAndOtherAdjustments'] =
    xbrl.getFactValue(
      'us-gaap:PreferredStockDividendsAndOtherAdjustments',
      'Duration'
    ) || 0;

  // #NetIncomeAttributableToNoncontrollingInterest
  xbrl.fields['NetIncomeAttributableToNoncontrollingInterest'] =
    xbrl.getFactValue(
      'us-gaap:NetIncomeLossAttributableToNoncontrollingInterest',
      'Duration'
    ) || 0;

  // #NetIncomeAttributableToParent
  xbrl.fields['NetIncomeAttributableToParent'] =
    xbrl.getFactValue('us-gaap:NetIncomeLoss', 'Duration') || 0;

  // OtherComprehensiveIncome
  xbrl.fields['OtherComprehensiveIncome'] =
    xbrl.getFactValue(
      'us-gaap:OtherComprehensiveIncomeLossNetOfTax',
      'Duration'
    ) ||
    xbrl.getFactValue(
      'us-gaap:OtherComprehensiveIncomeLossNetOfTax',
      'Duration'
    ) ||
    0;

  // ComprehensiveIncome
  xbrl.fields['ComprehensiveIncome'] =
    xbrl.getFactValue(
      'us-gaap:ComprehensiveIncomeNetOfTaxIncludingPortionAttributableToNoncontrollingInterest',
      'Duration'
    ) ||
    xbrl.getFactValue('us-gaap:ComprehensiveIncomeNetOfTax', 'Duration') ||
    0;

  // ComprehensiveIncomeAttributableToParent
  xbrl.fields['ComprehensiveIncomeAttributableToParent'] =
    xbrl.getFactValue('us-gaap:ComprehensiveIncomeNetOfTax', 'Duration') ||
    xbrl.getFactValue('us-gaap:ComprehensiveIncomeNetOfTax', 'Duration') ||
    0;

  // ComprehensiveIncomeAttributableToNoncontrollingInterest
  xbrl.fields['ComprehensiveIncomeAttributableToNoncontrollingInterest'] =
    xbrl.getFactValue(
      'us-gaap:ComprehensiveIncomeNetOfTaxAttributableToNoncontrollingInterest',
      'Duration'
    ) ||
    xbrl.getFactValue(
      'us-gaap:ComprehensiveIncomeNetOfTaxAttributableToNoncontrollingInterest',
      'Duration'
    ) ||
    0;

  // 'Adjustments to income statement information
  // Impute: NonoperatingIncomeLossPlusInterestAndDebtExpense
  xbrl.fields['NonoperatingIncomeLossPlusInterestAndDebtExpense'] =
    xbrl.fields['NonoperatingIncomeLoss'] +
    xbrl.fields['InterestAndDebtExpense'];

  // Impute: Net income available to common stockholders  (if it does not exist)
  if (
    xbrl.fields['NetIncomeAvailableToCommonStockholdersBasic'] === 0 &&
    xbrl.fields['PreferredStockDividendsAndOtherAdjustments'] === 0 &&
    xbrl.fields['NetIncomeAttributableToParent'] !== 0
  ) {
    xbrl.fields['NetIncomeAvailableToCommonStockholdersBasic'] =
      xbrl.fields['NetIncomeAttributableToParent'];
  }

  // Impute NetIncomeLoss
  if (
    xbrl.fields['NetIncomeLoss'] !== 0 &&
    xbrl.fields['IncomeFromContinuingOperationsAfterTax'] === 0
  ) {
    xbrl.fields['IncomeFromContinuingOperationsAfterTax'] =
      xbrl.fields['NetIncomeLoss'] -
      xbrl.fields['IncomeFromDiscontinuedOperations'] -
      xbrl.fields['ExtraordaryItemsGainLoss'];
  }

  // Impute: Net income attributable to parent if it does not exist
  if (
    xbrl.fields['NetIncomeAttributableToParent'] === 0 &&
    xbrl.fields['NetIncomeAttributableToNoncontrollingInterest'] === 0 &&
    xbrl.fields['NetIncomeLoss'] !== 0
  ) {
    xbrl.fields['NetIncomeAttributableToParent'] = xbrl.fields['NetIncomeLoss'];
  }

  // Impute: PreferredStockDividendsAndOtherAdjustments
  if (
    xbrl.fields['PreferredStockDividendsAndOtherAdjustments'] === 0 &&
    xbrl.fields['NetIncomeAttributableToParent'] !== 0 &&
    xbrl.fields['NetIncomeAvailableToCommonStockholdersBasic'] !== 0
  ) {
    xbrl.fields['PreferredStockDividendsAndOtherAdjustments'] =
      xbrl.fields['NetIncomeAttributableToParent'] -
      xbrl.fields['NetIncomeAvailableToCommonStockholdersBasic'];
  }

  // Impute: comprehensive income
  if (
    xbrl.fields['ComprehensiveIncomeAttributableToParent'] === 0 &&
    xbrl.fields['ComprehensiveIncomeAttributableToNoncontrollingInterest'] ===
      0 &&
    xbrl.fields['ComprehensiveIncome'] === 0 &&
    xbrl.fields['OtherComprehensiveIncome'] === 0
  ) {
    xbrl.fields['ComprehensiveIncome'] = xbrl.fields['NetIncomeLoss'];
  }

  // Impute: other comprehensive income
  if (
    xbrl.fields['ComprehensiveIncome'] !== 0 &&
    xbrl.fields['OtherComprehensiveIncome'] === 0
  ) {
    xbrl.fields['OtherComprehensiveIncome'] =
      xbrl.fields['ComprehensiveIncome'] - xbrl.fields['NetIncomeLoss'];
  }

  // Impute: comprehensive income attributable to parent if it does not exist
  if (
    xbrl.fields['ComprehensiveIncomeAttributableToParent'] === 0 &&
    xbrl.fields['ComprehensiveIncomeAttributableToNoncontrollingInterest'] ===
      0 &&
    xbrl.fields['ComprehensiveIncome'] !== 0
  ) {
    xbrl.fields['ComprehensiveIncomeAttributableToParent'] =
      xbrl.fields['ComprehensiveIncome'];
  }

  // Impute: IncomeFromContinuingOperations*Before*Tax
  if (
    xbrl.fields['IncomeBeforeEquityMethodInvestments'] !== 0 &&
    xbrl.fields['IncomeFromEquityMethodInvestments'] !== 0 &&
    xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] === 0
  ) {
    xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] =
      xbrl.fields['IncomeBeforeEquityMethodInvestments'] +
      xbrl.fields['IncomeFromEquityMethodInvestments'];
  }

  // Impute: IncomeFromContinuingOperations*Before*Tax2 (if income before tax is missing)
  if (
    xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] === 0 &&
    xbrl.fields['IncomeFromContinuingOperationsAfterTax'] !== 0
  ) {
    xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] =
      xbrl.fields['IncomeFromContinuingOperationsAfterTax'] +
      xbrl.fields['IncomeTaxExpenseBenefit'];
  }

  // Impute: IncomeFromContinuingOperations*After*Tax
  if (
    xbrl.fields['IncomeFromContinuingOperationsAfterTax'] === 0 &&
    (xbrl.fields['IncomeTaxExpenseBenefit'] !== 0 ||
      xbrl.fields['IncomeTaxExpenseBenefit'] === 0) &&
    xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] !== 0
  ) {
    xbrl.fields['IncomeFromContinuingOperationsAfterTax'] =
      xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] -
      xbrl.fields['IncomeTaxExpenseBenefit'];
  }

  // Impute: GrossProfit
  if (
    xbrl.fields['GrossProfit'] === 0 &&
    xbrl.fields['Revenues'] !== 0 &&
    xbrl.fields['CostOfRevenue'] !== 0
  ) {
    xbrl.fields['GrossProfit'] =
      xbrl.fields['Revenues'] - xbrl.fields['CostOfRevenue'];
  }

  // Impute: GrossProfit
  if (
    xbrl.fields['GrossProfit'] === 0 &&
    xbrl.fields['Revenues'] !== 0 &&
    xbrl.fields['CostOfRevenue'] !== 0
  ) {
    xbrl.fields['GrossProfit'] =
      xbrl.fields['Revenues'] - xbrl.fields['CostOfRevenue'];
  }

  // Impute: Revenues
  if (
    xbrl.fields['GrossProfit'] !== 0 &&
    xbrl.fields['Revenues'] === 0 &&
    xbrl.fields['CostOfRevenue'] !== 0
  ) {
    xbrl.fields['Revenues'] =
      xbrl.fields['GrossProfit'] + xbrl.fields['CostOfRevenue'];
  }

  // Impute: CostOfRevenue
  if (
    xbrl.fields['GrossProfit'] !== 0 &&
    xbrl.fields['Revenues'] !== 0 &&
    xbrl.fields['CostOfRevenue'] === 0
  ) {
    xbrl.fields['CostOfRevenue'] =
      xbrl.fields['Revenues'] - xbrl.fields['GrossProfit'];
  }

  // Impute: CostsAndExpenses (would NEVER have costs and expenses if has gross profit, gross profit is multi-step and costs and expenses is single-step)
  if (
    xbrl.fields['GrossProfit'] === 0 &&
    xbrl.fields['CostsAndExpenses'] === 0 &&
    xbrl.fields['CostOfRevenue'] !== 0 &&
    xbrl.fields['OperatingExpenses'] !== 0
  ) {
    xbrl.fields['CostsAndExpenses'] =
      xbrl.fields['CostOfRevenue'] + xbrl.fields['OperatingExpenses'];
  }

  // Impute: CostsAndExpenses based on existence of both costs of revenues and operating expenses
  if (
    xbrl.fields['CostsAndExpenses'] === 0 &&
    xbrl.fields['OperatingExpenses'] !== 0 &&
    xbrl.fields['CostOfRevenue'] !== 0
  ) {
    xbrl.fields['CostsAndExpenses'] =
      xbrl.fields['CostOfRevenue'] + xbrl.fields['OperatingExpenses'];
  }

  // Impute: CostsAndExpenses
  if (
    xbrl.fields['GrossProfit'] === 0 &&
    xbrl.fields['CostsAndExpenses'] === 0 &&
    xbrl.fields['Revenues'] !== 0 &&
    xbrl.fields['OperatingIncomeLoss'] !== 0 &&
    xbrl.fields['OtherOperatingIncome'] !== 0
  ) {
    xbrl.fields['CostsAndExpenses'] =
      xbrl.fields['Revenues'] -
      xbrl.fields['OperatingIncomeLoss'] -
      xbrl.fields['OtherOperatingIncome'];
  }

  // Impute: OperatingExpenses based on existence of costs and expenses and cost of revenues
  if (
    xbrl.fields['CostOfRevenue'] !== 0 &&
    xbrl.fields['CostsAndExpenses'] !== 0 &&
    xbrl.fields['OperatingExpenses'] === 0
  ) {
    xbrl.fields['OperatingExpenses'] =
      xbrl.fields['CostsAndExpenses'] - xbrl.fields['CostOfRevenue'];
  }

  // Impute: CostOfRevenues single-step method
  if (
    xbrl.fields['Revenues'] !== 0 &&
    xbrl.fields['GrossProfit'] === 0 &&
    xbrl.fields['Revenues'] - xbrl.fields['CostsAndExpenses'] ===
      xbrl.fields['OperatingIncomeLoss'] &&
    xbrl.fields['OperatingExpenses'] === 0 &&
    xbrl.fields['OtherOperatingIncome'] === 0
  ) {
    xbrl.fields['CostOfRevenue'] =
      xbrl.fields['CostsAndExpenses'] - xbrl.fields['OperatingExpenses'];
  }

  // Impute: IncomeBeforeEquityMethodInvestments
  if (
    xbrl.fields['IncomeBeforeEquityMethodInvestments'] === 0 &&
    xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] !== 0
  ) {
    xbrl.fields['IncomeBeforeEquityMethodInvestments'] =
      xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] -
      xbrl.fields['IncomeFromEquityMethodInvestments'];
  }

  // Impute: IncomeBeforeEquityMethodInvestments
  if (
    xbrl.fields['OperatingIncomeLoss'] !== 0 &&
    xbrl.fields['NonoperatingIncomeLoss'] !== 0 &&
    xbrl.fields['InterestAndDebtExpense'] === 0 &&
    xbrl.fields['IncomeBeforeEquityMethodInvestments'] !== 0
  ) {
    xbrl.fields['InterestAndDebtExpense'] =
      xbrl.fields['IncomeBeforeEquityMethodInvestments'] -
      (xbrl.fields['OperatingIncomeLoss'] +
        xbrl.fields['NonoperatingIncomeLoss']);
  }

  // Impute: OtherOperatingIncome
  if (
    xbrl.fields['GrossProfit'] !== 0 &&
    xbrl.fields['OperatingExpenses'] !== 0 &&
    xbrl.fields['OperatingIncomeLoss'] !== 0
  ) {
    xbrl.fields['OtherOperatingIncome'] =
      xbrl.fields['OperatingIncomeLoss'] -
      (xbrl.fields['GrossProfit'] - xbrl.fields['OperatingExpenses']);
  }

  // Move IncomeFromEquityMethodInvestments
  if (
    xbrl.fields['IncomeFromEquityMethodInvestments'] !== 0 &&
    xbrl.fields['IncomeBeforeEquityMethodInvestments'] !== 0 &&
    xbrl.fields['IncomeBeforeEquityMethodInvestments'] !==
      xbrl.fields['IncomeFromContinuingOperationsBeforeTax']
  ) {
    xbrl.fields['IncomeBeforeEquityMethodInvestments'] =
      xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] -
      xbrl.fields['IncomeFromEquityMethodInvestments'];
    xbrl.fields['OperatingIncomeLoss'] =
      xbrl.fields['OperatingIncomeLoss'] -
      xbrl.fields['IncomeFromEquityMethodInvestments'];
  }

  // DANGEROUS!!  May need to turn off. IS3 had 2085 PASSES WITHOUT this imputing. if it is higher,: keep the test
  // Impute: OperatingIncomeLoss
  if (
    xbrl.fields['OperatingIncomeLoss'] === 0 &&
    xbrl.fields['IncomeBeforeEquityMethodInvestments'] !== 0
  ) {
    xbrl.fields['OperatingIncomeLoss'] =
      xbrl.fields['IncomeBeforeEquityMethodInvestments'] +
      xbrl.fields['NonoperatingIncomeLoss'] -
      xbrl.fields['InterestAndDebtExpense'];
  }

  xbrl.fields[
    'NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'
  ] =
    xbrl.fields['IncomeFromContinuingOperationsBeforeTax'] -
    xbrl.fields['OperatingIncomeLoss'];

  // NonoperatingIncomeLossPlusInterestAndDebtExpense
  if (
    xbrl.fields['NonoperatingIncomeLossPlusInterestAndDebtExpense'] === 0 &&
    xbrl.fields[
      'NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'
    ] !== 0
  ) {
    xbrl.fields['NonoperatingIncomeLossPlusInterestAndDebtExpense'] =
      xbrl.fields[
        'NonoperatingIncomePlusInterestAndDebtExpensePlusIncomeFromEquityMethodInvestments'
      ] - xbrl.fields['IncomeFromEquityMethodInvestments'];
  }

  // Cash flow statement

  // NetCashFlow
  xbrl.fields['NetCashFlow'] =
    xbrl.getFactValue(
      'us-gaap:CashAndCashEquivalentsPeriodIncreaseDecrease',
      'Duration'
    ) ||
    xbrl.getFactValue('us-gaap:CashPeriodIncreaseDecrease', 'Duration') ||
    xbrl.getFactValue(
      'us-gaap:NetCashProvidedByUsedInContinuingOperations',
      'Duration'
    ) ||
    0;

  // NetCashFlowsOperating
  xbrl.fields['NetCashFlowsOperating'] =
    xbrl.getFactValue(
      'us-gaap:NetCashProvidedByUsedInOperatingActivities',
      'Duration'
    ) || 0;

  // NetCashFlowsInvesting
  xbrl.fields['NetCashFlowsInvesting'] =
    xbrl.getFactValue(
      'us-gaap:NetCashProvidedByUsedInInvestingActivities',
      'Duration'
    ) || 0;

  // NetCashFlowsFinancing
  xbrl.fields['NetCashFlowsFinancing'] =
    xbrl.getFactValue(
      'us-gaap:NetCashProvidedByUsedInFinancingActivities',
      'Duration'
    ) || 0;

  // NetCashFlowsOperatingContinuing
  xbrl.fields['NetCashFlowsOperatingContinuing'] =
    xbrl.getFactValue(
      'us-gaap:NetCashProvidedByUsedInOperatingActivitiesContinuingOperations',
      'Duration'
    ) || 0;

  // NetCashFlowsInvestingContinuing
  xbrl.fields['NetCashFlowsInvestingContinuing'] =
    xbrl.getFactValue(
      'us-gaap:NetCashProvidedByUsedInInvestingActivitiesContinuingOperations',
      'Duration'
    ) || 0;
  // NetCashFlowsFinancingContinuing
  xbrl.fields['NetCashFlowsFinancingContinuing'] =
    xbrl.getFactValue(
      'us-gaap:NetCashProvidedByUsedInFinancingActivitiesContinuingOperations',
      'Duration'
    ) || 0;

  // NetCashFlowsOperatingDiscontinued
  xbrl.fields['NetCashFlowsOperatingDiscontinued'] =
    xbrl.getFactValue(
      'us-gaap:CashProvidedByUsedInOperatingActivitiesDiscontinuedOperations',
      'Duration'
    ) || 0;

  // NetCashFlowsInvestingDiscontinued
  xbrl.fields['NetCashFlowsInvestingDiscontinued'] =
    xbrl.getFactValue(
      'us-gaap:CashProvidedByUsedInInvestingActivitiesDiscontinuedOperations',
      'Duration'
    ) || 0;

  // NetCashFlowsFinancingDiscontinued
  xbrl.fields['NetCashFlowsFinancingDiscontinued'] =
    xbrl.getFactValue(
      'us-gaap:CashProvidedByUsedInFinancingActivitiesDiscontinuedOperations',
      'Duration'
    ) || 0;

  // NetCashFlowsDiscontinued
  xbrl.fields['NetCashFlowsDiscontinued'] =
    xbrl.getFactValue(
      'us-gaap:NetCashProvidedByUsedInDiscontinuedOperations',
      'Duration'
    ) || 0;

  // ExchangeGainsLosses
  xbrl.fields['ExchangeGainsLosses'] =
    xbrl.getFactValue(
      'us-gaap:EffectOfExchangeRateOnCashAndCashEquivalents',
      'Duration'
    ) ||
    xbrl.getFactValue(
      'us-gaap:EffectOfExchangeRateOnCashAndCashEquivalentsContinuingOperations',
      'Duration'
    ) ||
    xbrl.getFactValue(
      'us-gaap:CashProvidedByUsedInFinancingActivitiesDiscontinuedOperations',
      'Duration'
    ) ||
    0;

  // Adjustments
  // Impute: total net cash flows discontinued if not reported
  if (xbrl.fields['NetCashFlowsDiscontinued'] === 0) {
    xbrl.fields['NetCashFlowsDiscontinued'] =
      xbrl.fields['NetCashFlowsOperatingDiscontinued'] +
      xbrl.fields['NetCashFlowsInvestingDiscontinued'] +
      xbrl.fields['NetCashFlowsFinancingDiscontinued'];
  }

  // Impute: cash flows from continuing
  if (
    xbrl.fields['NetCashFlowsOperating'] !== 0 &&
    xbrl.fields['NetCashFlowsOperatingContinuing'] === 0
  ) {
    xbrl.fields['NetCashFlowsOperatingContinuing'] =
      xbrl.fields['NetCashFlowsOperating'] -
      xbrl.fields['NetCashFlowsOperatingDiscontinued'];
  }

  if (
    xbrl.fields['NetCashFlowsInvesting'] !== 0 &&
    xbrl.fields['NetCashFlowsInvestingContinuing'] === 0
  ) {
    xbrl.fields['NetCashFlowsInvestingContinuing'] =
      xbrl.fields['NetCashFlowsInvesting'] -
      xbrl.fields['NetCashFlowsInvestingDiscontinued'];
  }

  if (
    xbrl.fields['NetCashFlowsFinancing'] !== 0 &&
    xbrl.fields['NetCashFlowsFinancingContinuing'] === 0
  ) {
    xbrl.fields['NetCashFlowsFinancingContinuing'] =
      xbrl.fields['NetCashFlowsFinancing'] -
      xbrl.fields['NetCashFlowsFinancingDiscontinued'];
  }

  if (
    xbrl.fields['NetCashFlowsOperating'] === 0 &&
    xbrl.fields['NetCashFlowsOperatingContinuing'] !== 0 &&
    xbrl.fields['NetCashFlowsOperatingDiscontinued'] === 0
  ) {
    xbrl.fields['NetCashFlowsOperating'] =
      xbrl.fields['NetCashFlowsOperatingContinuing'];
  }

  if (
    xbrl.fields['NetCashFlowsInvesting'] === 0 &&
    xbrl.fields['NetCashFlowsInvestingContinuing'] !== 0 &&
    xbrl.fields['NetCashFlowsInvestingDiscontinued'] === 0
  ) {
    xbrl.fields['NetCashFlowsInvesting'] =
      xbrl.fields['NetCashFlowsInvestingContinuing'];
  }

  if (
    xbrl.fields['NetCashFlowsFinancing'] === 0 &&
    xbrl.fields['NetCashFlowsFinancingContinuing'] !== 0 &&
    xbrl.fields['NetCashFlowsFinancingDiscontinued'] === 0
  ) {
    xbrl.fields['NetCashFlowsFinancing'] =
      xbrl.fields['NetCashFlowsFinancingContinuing'];
  }

  xbrl.fields['NetCashFlowsContinuing'] =
    xbrl.fields['NetCashFlowsOperatingContinuing'] +
    xbrl.fields['NetCashFlowsInvestingContinuing'] +
    xbrl.fields['NetCashFlowsFinancingContinuing'];

  // Impute: if net cash flow is missing,: this tries to figure out the value by adding up the detail
  if (
    xbrl.fields['NetCashFlow'] === 0 &&
    (xbrl.fields['NetCashFlowsOperating'] !== 0 ||
      xbrl.fields['NetCashFlowsInvesting'] !== 0 ||
      xbrl.fields['NetCashFlowsFinancing'] !== 0)
  ) {
    xbrl.fields['NetCashFlow'] =
      xbrl.fields['NetCashFlowsOperating'] +
      xbrl.fields['NetCashFlowsInvesting'] +
      xbrl.fields['NetCashFlowsFinancing'];
  }

  var lngCF1 =
    xbrl.fields['NetCashFlow'] -
    (xbrl.fields['NetCashFlowsOperating'] +
      xbrl.fields['NetCashFlowsInvesting'] +
      xbrl.fields['NetCashFlowsFinancing'] +
      xbrl.fields['ExchangeGainsLosses']);

  if (
    lngCF1 !== 0 &&
    xbrl.fields['NetCashFlow'] -
      (xbrl.fields['NetCashFlowsOperating'] +
        xbrl.fields['NetCashFlowsInvesting'] +
        xbrl.fields['NetCashFlowsFinancing'] +
        xbrl.fields['ExchangeGainsLosses']) ===
      xbrl.fields['ExchangeGainsLosses'] * -1
  ) {
    lngCF1 = 888888;
  }

  // Key ratios
  xbrl.fields['SGR'] =
    ((xbrl.fields['NetIncomeLoss'] / xbrl.fields['Revenues']) *
      (1 +
        (xbrl.fields['Assets'] - xbrl.fields['Equity']) /
          xbrl.fields['Equity'])) /
      (1 / (xbrl.fields['Revenues'] / xbrl.fields['Assets']) -
        (xbrl.fields['NetIncomeLoss'] / xbrl.fields['Revenues']) *
          (1 +
            (xbrl.fields['Assets'] - xbrl.fields['Equity']) /
              xbrl.fields['Equity'])) || null;

  xbrl.fields['ROA'] = xbrl.fields['NetIncomeLoss'] / xbrl.fields['Assets'];

  xbrl.fields['ROE'] = xbrl.fields['NetIncomeLoss'] / xbrl.fields['Equity'];

  xbrl.fields['ROS'] = xbrl.fields['NetIncomeLoss'] / xbrl.fields['Revenues'];
}
