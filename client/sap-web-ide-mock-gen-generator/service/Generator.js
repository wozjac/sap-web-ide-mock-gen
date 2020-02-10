define([
    "sap-web-ide-mock-gen-generator/js/CurrentProject",
    "sap-web-ide-mock-gen-generator/js/ODataMockGenerator"
], function(CurrentProject, ODataMockGenerator) {
    return {
        //default paths
        metadataFilePath: "webapp/localService/metadata.xml",
        mockDataTargetDir: "webapp/localService/mockdata",

        generateMockData: function() {
            var that = this;
            var currentProject = new CurrentProject(this.context);
            var message;

            currentProject.getMockGenerationConfigFile()
                .then(function(mockGenerationConfigContent) {
                    if (mockGenerationConfigContent) {
                        that._setupMockGenerationConfig(mockGenerationConfigContent);
                    } else {
                        message = that.context.i18n.getText("i18n", "mockGenerationConfigNotFound");
                        that.context.service.log.info("Mock Data Generator", message).done();
                    }

                    return;
                })
                .then(function() {
                    return Promise.all([
                        currentProject.getLocalServiceMetadata(that.metadataFilePath),
                        currentProject.getMockDataConfigFile(that.mockDataTargetDir)
                    ])
                })
                .then(function(filesContent) {
                    if (!filesContent[1]) {
                        message = that.context.i18n.getText("i18n", "mockConfigNotFound");
                        that.context.service.usernotification.liteNotificationInfo(message);
                        that.context.service.log.info("Mock Data Generator", message).done();
                    } else {
                    	message = that.context.i18n.getText("i18n", "mockConfigFound");
                    	that.context.service.log.info("Mock Data Generator", message).done();
                    }

                    var mockGenerator = new ODataMockGenerator(filesContent[0], filesContent[1]);
                    return mockGenerator.createMockData();
                })
                .then(function(generatedFilesData) {
                    if (generatedFilesData && generatedFilesData.length > 0) {
                        return currentProject.saveMockDataFiles(generatedFilesData, that.mockDataTargetDir);
                    } else {
                        return null;
                    }
                })
                .catch(function(error) {
                    switch (error.code) {
                        case CurrentProject.ERRORS.METADATA_FILE_NOT_FOUND:
                            message = that.context.i18n.getText("i18n", "metadataNotFound", [that.metadataFilePath]);
                            break;
                        case CurrentProject.ERRORS.NO_ACTIVE_FILE_IN_EDITOR:
                            message = that.context.i18n.getText("i18n", "noActiveFile");
                            break;
                        default:
                            message = error;
                    }

                    that.context.service.usernotification.liteNotificationFailure(message);
                    that.context.service.log.error("Mock Data Generator", message).done();
                })
        },

        _setupMockGenerationConfig: function(mockGenerationConfigContent) {
            var message;

            var mockGenerationConfig = JSON.parse(mockGenerationConfigContent);
            message = this.context.i18n.getText("i18n", "mockGenerationConfigFound");
            this.context.service.log.info("Mock Data Generator", message).done();

            if (mockGenerationConfig.metadataFilePath) {
                this.metadataFilePath = mockGenerationConfig.metadataFilePath
                message = this.context.i18n.getText("i18n", "metadataPathConfigFound", [this.metadataFilePath]);
            } else {
                message = this.context.i18n.getText("i18n", "metadataPathConfigNotFound", [this.metadataFilePath]);
            }

            this.context.service.log.info("Mock Data Generator", message).done();

            if (mockGenerationConfig.mockDataTargetDir) {
                this.mockDataTargetDir = mockGenerationConfig.mockDataTargetDir;
                message = this.context.i18n.getText("i18n", "mockDataTargetDirConfigFound", [this.mockDataTargetDir]);
            } else {
                message = this.context.i18n.getText("i18n", "mockDataTargetDirConfigNotFound", [this.mockDataTargetDir]);
            }
            
            this.context.service.log.info("Mock Data Generator", message).done();
        }
    }
});