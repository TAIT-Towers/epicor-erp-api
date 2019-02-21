const SimpleSchema = require('simpl-schema').default

const ServiceBase = require('./serviceBase')

const SERVICE = 'ERP.BO.ProjectSvc'

class Project extends ServiceBase {
    constructor(connection) {
        super(connection, SERVICE, 'Project', 'ProjectID')
    }

    async updateProject(entry, customProjectData) {
        new SimpleSchema({
            ProjectID: String
        }).validate(entry)
        let ds = (await this.makeRequest('GetByID', {
            projectID: entry.ProjectID
        })).returnObj
        let project = ds.Project[0]
        if (!project)
            throw new Error(`Project id ${entry.ProjectID} cannot be found`)

        if (customProjectData) {
            Object.assign(project, {
                ...customProjectData,
                RowMod: 'U'
            })
        }

        const resultDs = (await this.makeRequest('Update', {
            ds
        })).parameters.ds

        return resultDs
    }
}

module.exports = Project