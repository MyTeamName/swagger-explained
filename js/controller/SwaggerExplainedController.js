app.controller('SwaggerExplainedController', function ($scope, $http, swgOutputSelection, $location) {
    
    $scope.url = $location.search().url || 'https://cdn.rawgit.com/swagger-api/swagger-spec/master/examples/v2.0/json/petstore-simple.json';

    var method2annotation = {
        get: "@SWG\\Get",
        post: "@SWG\\Post",
        put: "@SWG\\Put",
        patch: "@SWG\\Patch",
        delete: "@SWG\\Delete",
        head: "@SWG\\Head",
        options: "@SWG\\Options"
    };
    function explainJsonSpec(object, type) {
        if (object.items) {
            if (type === "parameter" && object.in !== "body" || type === "header") {
                object.items._explained = {
                    annotation: "@SWG\\Items",
                    spec: "itemsObject"
                };
                explainJsonSpec(object.items, "items");
            } else {
                object.items._explained = {
                    annotation: "@SWG\\Items",
                    spec: "schemaObject"
                };
                explainJsonSpec(object.items, "items");
            }
        }
        if (object.schema) {
            object.schema._explained = {
                annotation: "@SWG\\Schema",
                spec: "schemaObject"
            };
            explainJsonSpec(object.schema, "schema");
        }
        if (object.properties) {
            for (var name in object.properties) {
                var property = object.properties[name];
                property._explained = {
                    annotation: "@SWG\\Property",
                    spec: "schemaObject"
                };
                explainJsonSpec(property, "property");
            }
            
        }
        if (object.allOf) {
            for (var i in object.allOf) {
                var schema = object.allOf[i];
                schema._explained = {
                    spec: "schemaObject"
                };
                explainJsonSpec(schema, "schema");
            }
        }
        if (object.externalDocs) {
            object.externalDocs._explained = {
                annotation: "@SWG\\ExternalDocumentation",
                spec: "externalDocumentationObject"
            }
        }
        if (object.xml) {
            object.xml._explained = {
                annotation: "@SWG\\Xml",
                spec: "xmlObject"
            }
        }
    }
    function showSpec(name) {
        if (!$scope.spec || !$scope.spec[name]) { // no spec entry found/ not loaded
            return;
        }
        if (!$scope.explained) { // No explained selected?
            swgOutputSelection.set({spec: name});
            return;
        }
        if ($scope.explained.spec !== name) { // isn't already visible?
            swgOutputSelection.set({spec: name});
            return;
        }
    }
    $scope.$watch('url', function (url) {
        $scope.swagger = "Loading...";
        $http.get(url).success(function (swagger) {
            // augment data with explanations
            swagger._explained = {
                annotation: "@SWG\\Swagger",
                spec: "swaggerObject"
            };
            if (swagger.info) {
                swagger.info._explained = {
                    annotation: "@SWG\\Info",
                    spec: "infoObject"
                };
                if (swagger.info.contact) {
                    swagger.info.contact._explained = {
                        annotation: "@SWG\\Contact",
                        spec: "contactObject"
                    };
                }
                if (swagger.info.license) {
                    swagger.info.license._explained = {
                        annotation: "@SWG\\License",
                        spec: "licenseObject"
                    };
                }
            }
            if (swagger.paths) {
                for (var path in swagger.paths) {
                    var pathItem = swagger.paths[path];
                    pathItem._explained = {
                        annotation: "@SWG\\Path",
                        spec: "pathItemObject"
                    };

                    for (var method in pathItem) {
                        var operation = pathItem[method];
                        operation._explained = {
                            spec: "operationObject",
                            annotation: method2annotation[method]
                        };
                        if (operation.parameters) {
                            for (var i in operation.parameters) {
                                var parameter = operation.parameters[i];
                                parameter._explained = {
                                    spec: 'parameterObject',
                                    annotation: '@SWG\\Parameter'
                                };
                                explainJsonSpec(parameter, "parameter");
                            }
                        }
                        if (operation.responses) {
                            for (var j in operation.responses) {
                                var response = operation.responses[j];
                                response._explained = {
                                    spec: 'responseObject',
                                    annotation: '@SWG\\Response'
                                };
                                explainJsonSpec(response, "response");
                                if (response.headers) {
                                    for (var k in response.headers) {
                                        var header = response.headers[k];
                                        header._explained = {
                                            spec: "headerObject",
                                            annotation: "@SWG\\Header"
                                        }
                                    }
                                    explainJsonSpec(header, "header");
                                }
                            }
                            operation.responses._explained = {
                                spec: "responsesObject"
                            };
                        }
                    }
                }
                swagger.paths._explained = {
                    spec: "pathsObject"
                };
            }
            if (swagger.definitions) {
                for (var name in swagger.definitions) {
                    var definition = swagger.definitions[name];
                    definition._explained = {
                        spec: "schemaObject",
                        annotation: "@SWG\\Definition"
                    };
                    explainJsonSpec(definition, "definition");
                }
                swagger.definitions._explained = {
                    spec: "definitionsObject"
                };
            }
            if (swagger.securityDefinitions) {
                for (var name in swagger.securityDefinitions) {
                    var securityDefinition = swagger.securityDefinitions[name];
                    securityDefinition._explained = {
                        annotation: "@SWG\\SecurityScheme",
                        spec: "securitySchemeObject"
                    }
                }
            }
            if (swagger.tags) {
                for (var i in swagger.tags) {
                    var tag = swagger.tags[i];
                    tag._explained = {
                        annotation: "@SWG\\Tag",
                        spec: "tagObject"
                    }
                }
            }
            $scope.swagger = swagger;
        }).catch(function (response) {
            $scope.swagger = {error: "Failed to load", url: url, status: response.status};
        });
    });
    $http.get('swagger-spec.json').success(function (spec) {
        $scope.spec = spec;
        showSpec($location.path().substr(1));
    });
    $scope.$on('swgOutputSelectionChanged', function (event, explained) {
        $scope.explained = explained;
        if ($location.path().substr(1) !== $scope.explained.spec) {
            $location.path($scope.explained.spec);
        }
    });
    $scope.updateSelection = function (explained) {
        swgOutputSelection.set(explained);
    };
    $scope.$on('$locationChangeSuccess', function () {
        showSpec($location.path().substr(1));
    });
});
