'use strict';

const ServiceBase = require('./serviceBase');

const SERVICE = 'Erp.Bo.VendorSvc';

class Supplier extends ServiceBase {
  constructor(connection) {
    super(connection, SERVICE, 'Vendor', 'VendorNum');
  }

  _getRows(where, pageSize, currentPage) {
    // we have to use getRows because GetList does not return all the data
    const params = {
      whereClauseVendor: where,
      whereClauseVendorAttch: '',
      whereClauseEntityGLC: '',
      whereClauseTaxExempt: '',
      whereClausePartner: '',
      whereClausePEVendWhldHist: '',
      whereClauseVendRestriction: '',
      whereClauseVendBank: '',
      whereClauseVendBankAttch: '',
      whereClauseVendCntMain: '',
      whereClauseVenMFBill: '',
      whereClauseVendorPP: '',
      whereClauseVenPPMFBill: '',
      whereClauseVenPPUPSEmail: '',
      whereClauseVendPPRestriction: '',
      whereClauseVendCnt: '',
      whereClauseVendCntAttch: '',
      whereClauseVenUPSEmail: '',
      whereClauseVendRemitTo: '',
      pageSize,
      absolutePage: currentPage
    };
    return this.makeRequest('GetRows', params).then(results => ({
      dataset: results.returnObj,
      morePage: results.parameters.morePage
    }));
  }
}

module.exports = Supplier;
