define([], function() {
    return function CurrentProject(context) {
        this.contextService = context.service;
        this.context = context;

        CurrentProject.ERRORS = {
            NO_ACTIVE_FILE_IN_EDITOR: 1,
            METADATA_FILE_NOT_FOUND: 2,
            MOCK_CONFIG_FILE_NOT_FOUND: 3,
            FILE_NOT_FOUND: 4
        }

        CurrentProject.prototype.getActiveProject = function() {
            var that = this;

            return this.contextService.content.getCurrentDocument()
                .then(function(document) {
                    if (!document) {
                        var error = new Error(that.context.i18n.getText("i18n", "noActiveFile"));
                        error.code = CurrentProject.ERRORS.NO_ACTIVE_FILE_IN_EDITOR;
                        throw error;
                    }

                    return document.getProject();
                })
        }

        CurrentProject.prototype.getDocument = function(path) {
            var that = this;

            return this.getActiveProject()
                .then(function(project) {
                    return that.contextService.document.getDocumentByPath("/" + project.getName() + "/" + path);
                })
                .then(function(file) {
                    if (!file) {
                        var error = new Error(that.context.i18n.getText("i18n", "fileNotFound", [path]));
                        error.code = CurrentProject.ERRORS.FILE_NOT_FOUND;
                        throw error;
                    }

                    return file;
                });
        }

        CurrentProject.prototype.getLocalServiceMetadata = function(metadataFilePath) {
            var that = this;

            return this.getDocument(metadataFilePath)
                .then(function(document) {
                    return document.getContent();
                })
                .catch(function(err) {
                    switch (err.code) {
                        case CurrentProject.ERRORS.FILE_NOT_FOUND:
                            var error = new Error(that.context.i18n.getText("i18n", "metadataNotFound"));
                            error.code = CurrentProject.ERRORS.METADATA_FILE_NOT_FOUND;
                            throw error;
                        default:
                            throw err;
                    }
                });
        }

        CurrentProject.prototype.getMockDataConfigFile = function(mockDataTargetDir) {
            return this.getDocument(mockDataTargetDir + "/.mockconfig.json")
                .then(function(document) {
                    return document.getContent();
                })
                .catch(function(err) {
                    switch (err.code) {
                        case CurrentProject.ERRORS.FILE_NOT_FOUND:
                            //ignore this error - mock data will be generated with standard logic
                            return null;
                        default:
                            throw err;
                    }
                });
        }

        CurrentProject.prototype.getMockGenerationConfigFile = function() {
            return this.getDocument(".mockgen.json")
                .then(function(document) {
                    return document.getContent();
                })
                .catch(function(err) {
                    switch (err.code) {
                        case CurrentProject.ERRORS.FILE_NOT_FOUND:
                            //ignore this error - mock data will be generated with standard logic
                            return null;
                        default:
                            throw err;
                    }
                });
        }

        CurrentProject.prototype.saveMockDataFiles = function(filesData, targetDir) {
            var that = this;
            var result = [];
            var project;

            return this.getActiveProject()
                .then(function(activeProject) {
                    project = activeProject;
                    return project.createFolder("/" + targetDir);
                })
                .then(function(folder) {
                    for (var i = 0; i < filesData.length; i++) {
                        (function(k) {
                            result.push(that._saveFile(project, filesData[k], targetDir))
                        })(i);
                    }

                    return Promise.all(result);
                });
        }

        CurrentProject.prototype._saveFile = function(project, fileData, targetDir) {
            var that = this;
            var fileDocument;

            return project.createFile("/" + targetDir + "/" + fileData.filename)
                .then(function(document) {
                    fileDocument = document;
                    return that.contextService.beautifierProcessor.beautify(fileData.content, "js");
                })
                .then(function(content) {
                    return fileDocument.setContent(content);
                })
                .then(function() {
                    return fileDocument.save();
                })
                .catch(function(error) {
                    return that._updateFile(project, fileData, targetDir);
                })
        }

        CurrentProject.prototype._updateFile = function(project, fileData, targetDir) {
            var that = this;
            var fileDocument;

            return this.getDocument(targetDir + "/" + fileData.filename)
                .then(function(document) {
                    fileDocument = document;
                    return that.contextService.beautifierProcessor.beautify(fileData.content, "js");
                })
                .then(function(content) {
                    return fileDocument.setContent(content);
                })
                .then(function() {
                    return fileDocument.save();
                })
                .catch(function(error) {
                    throw new Error(error);
                })
        }
    }
});