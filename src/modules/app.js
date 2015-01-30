// cd src/modules ; find . | grep js
require('./simput/SimPut.js');
require('./simput/module.js');
require('./simput/core/module.js');
require('./simput/core/main-controller.js');
require('./simput/core/io-controller.js');
require('./simput/core/simput-input-controller.js');
require('./simput/core/simput-input-directive.js');
require('./simput/core/simput-input-content-directive.js');
require('./simput/core/simput-input-property-directive.js');

angular.module('SimPut', ['kitware.SimPut']);
