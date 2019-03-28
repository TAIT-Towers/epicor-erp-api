const Project = require('../lib/project.js');

describe('Project Service', () => {
  let projectSvc;

  beforeEach(() => {
    projectSvc = new Project({});
  });

  it('should have service methods', () => {
    expect(projectSvc).to.have.property('find');
    expect(projectSvc).to.have.property('get');
    expect(projectSvc).to.have.property('create');
    expect(projectSvc).to.have.property('update');
  });

  it('updates project data', done => {
    projectSvc.makeRequest = sinon.stub().returns(
        Promise.resolve({
            returnObj: {
                Project: [
                    {
                        Company: 100,
                        ProjectID: '12A0000'
                    }                    
                ]
            },
            parameters: {}
        })
    )
    done()
  });
});
