angular.module("kitware.SimPut.core")
    .controller('SimPut.IOController', ['$scope', '$window', '$timeout', function ($scope, $window, $timeout) {
        var dropTarget = document.getElementById('drop-data-model');

        function consumeEvent(event) {
            event.stopPropagation();
            event.preventDefault(); 

            if(event.type == "dragover") {
                dropTarget.classList.add('drag-over');
            } else {
                dropTarget.classList.remove('drag-over');
            }
            
            return false;
        }

        function processFile(event) {
            var files = event.target.files || event.dataTransfer.files,
                reader = new FileReader(),
                updateModel = $scope.updateDataModel;

            // Consume event
            consumeEvent(event);

            // process File
            if(files[0]) {
                reader.onloadend = function (event) {
                    updateModel(JSON.parse(reader.result));
                }
                reader.readAsText(files[0]);
            }

            // Remove drop listener
            dropTarget.removeEventListener('dragover', consumeEvent, false);
            dropTarget.removeEventListener('dragenter', consumeEvent, false);
            dropTarget.removeEventListener('drop', processFile, false);
        }

        // File reader - drop file
        dropTarget.addEventListener('dragover', consumeEvent, false);
        dropTarget.addEventListener('dragenter', consumeEvent, false);
        dropTarget.addEventListener('drop', processFile, false);

        function saveFile(fileName, content) {
            // Create data to download
            var newFileContent = new Blob([content], {type: 'application/octet-binary'}),
                downloadURL = $window.URL.createObjectURL(newFileContent),
                downloadLink = document.getElementById('file-download-link');

            downloadLink.href = downloadURL;
            downloadLink.download = fileName;
            downloadLink.click();

            // Free memory
            $timeout(function(){
                $window.URL.revokeObjectURL(downloadURL);
            }, 1000);
        }

        // --- Angular specific

        $scope.$on('save-file', function(event, arg) {
            saveFile(arg.name, arg.content);
        });

        $scope.SaveFile = saveFile;
    }]);
