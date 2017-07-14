const parseDatasetAsRecords = require('../../lib/utils/parseDatasetAsRecords')

describe('parseDatasetAsRecords', () => {
  it('should parse children', () => {
    const ds = {
      PropertyList: [
        { Company: 150, ParentId: '1' },
        { Company: 150, ParentId: '2' },
      ],
      Children: [
        { Company: 150, ChildId: '2', ParentId: '2' },
        { Company: 150, ChildId: '2', ParentId: 'SomeThingNotThere' }
      ]
    }
    const records = parseDatasetAsRecords(ds, 'ParentId')
    expect(records).to.eql([
      { Company: 150, ParentId: '1' },
      { Company: 150, ParentId: '2', Children: [{
        Company: 150, ChildId: '2', ParentId: '2'
      }]}
    ])
  })
})
