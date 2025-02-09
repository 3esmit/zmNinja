/* jshint -W041, -W083 */
/* jslint browser: true*/
/* global cordova,StatusBar,angular,console */

// controller for Monitor View
// refer to comments in EventCtrl for the modal stuff. They are almost the same

angular.module('zmApp.controllers')
    .controller('zmApp.MonitorCtrl', ['$ionicPopup', 'zm', '$scope', 'ZMDataModel', 'message', '$ionicSideMenuDelegate', '$ionicLoading', '$ionicModal', '$state', '$http', '$rootScope', '$timeout','$ionicHistory', '$ionicPlatform',
                               function ($ionicPopup, zm, $scope, ZMDataModel, message, $ionicSideMenuDelegate, $ionicLoading, $ionicModal, $state, $http, $rootScope, $timeout, $ionicHistory, $ionicPlatform) {


    //-----------------------------------------------------------------------
    // Controller Main
    //-----------------------------------------------------------------------

    // var isModalOpen = false;

   // console.log("***EVENTS: Waiting for Monitors to load before I proceed");
    $scope.monitors = [];
    $scope.monitors = message;
                                   
    
                                   
                                   
    if ($scope.monitors.length == 0)
    {
        $rootScope.zmPopup= $ionicPopup.alert({
                    title: "No Monitors found",
                    template: "Please check your credentials"
        });
        $ionicHistory.nextViewOptions({
                    disableBack: true
        });
        $state.go("login");
        return;
    }
    
    var loginData = ZMDataModel.getLogin();
    monitorStateCheck();
    //console.log("Setting Awake to " + ZMDataModel.getKeepAwake());
    ZMDataModel.setAwake(ZMDataModel.getKeepAwake());
                 
    // FIXME: need this as modalctrl uses it. Not needed for monitor
    // mode
    

    // --------------------------------------------------------
    // Handling of back button in case modal is open should
    // close the modal
    // --------------------------------------------------------                               
    
    $ionicPlatform.registerBackButtonAction(function (e) {
            e.preventDefault();
            if ($scope.modal.isShown())
            {
                // switch off awake, as liveview is finished
                ZMDataModel.zmDebug("Modal is open, closing it");
                ZMDataModel.setAwake(false);
                $scope.modal.remove();
            }
            else
            {
                ZMDataModel.zmDebug("Modal is closed, so toggling or exiting");
                if (!$ionicSideMenuDelegate.isOpenLeft()) 
                {
                    $ionicSideMenuDelegate.toggleLeft();
                   
                } 
                else 
                {
                    navigator.app.exitApp();
                }
            
            }
            
        }, 1000);
        
                                   
                                   

    $scope.openMenu = function () {
        $ionicSideMenuDelegate.toggleLeft();
    };


    //----------------------------------------------------------------
    // Alarm notification handling
    //----------------------------------------------------------------
    $scope.handleAlarms = function()
    {
        $rootScope.isAlarm=!$rootScope.isAlarm;
        if (!$rootScope.isAlarm)
        {
            $rootScope.alarmCount="0";
            $ionicHistory.nextViewOptions({disableBack: true});	
            
            
            $state.go("events", {"id": 0}, { reload: true });
        }
    };                               
    //-----------------------------------------------------------------------
    // This function takes care of changing monitor parameters
    // For now, I've only limited it to enable/disable and change monitor mode
    // and changing monitor function
    //-----------------------------------------------------------------------
    $scope.changeConfig = function (monitorName, monitorId, enabled, func) {
        var checked = false;
        //console.log("called with " + monitorId + ":" + enabled + ":" + func);
        if (enabled == '1') checked = true;

        $scope.monFunctions = [
            {
                text: "Modect",
                value: "Modect"
            },
            {
                text: "Mocord",
                value: "Mocord"
            },
            {
                text: "Record",
                value: "Record"
            },
            {
                text: "Nodect",
                value: "Nodect"
            },
            {
                text: "Monitor",
                value: "Monitor"
            },
            {
                text: "None",
                value: "None"
            }
        ];

        $scope.monfunc = {
            myfunc: func,
            myenabled: checked
        };

        $rootScope.zmPopup = $ionicPopup.show({
            scope: $scope,
            template: '<ion-toggle ng-model="monfunc.myenabled" ng-checked="monfunc.myenabled"  toggle-class="toggle-calm">Enabled</ion-toggle><ion-radio-fix ng-repeat="item in monFunctions" ng-value="item.value" ng-model="monfunc.myfunc"> {{item.text}} </ion-radio-fix>',


            title: 'Change Settings for ' + monitorName,

            buttons: [
                {
                    text: 'Cancel',

                },
                {
                    text: 'Save',
                    onTap: function (e) {

                        ZMDataModel.zmDebug("MonitorCtrl:changeConfig selection:" + $scope.monfunc.myenabled +
                            $scope.monfunc.myfunc);
                        var loginData = ZMDataModel.getLogin();
                        var apiRestart = loginData.apiurl + "/states/change/restart.json";
                        var apiMon = loginData.apiurl + "/monitors/" + monitorId + ".json";

                        ZMDataModel.zmDebug("MonitorCtrl: URLs for changeConfig save:" + apiMon);

                        var isEnabled = "";
                        isEnabled = ($scope.monfunc.myenabled == true) ? '1' : '0';

                        $ionicLoading.show({
                            template: "Applying changes. Please wait...",
                            noBackdrop: true,
                            duration: zm.largeHttpTimeout,
                        });

                        $http({
                            url: apiMon,
                            method: 'post',
                            headers: {
                                'Content-Type': 'application/x-www-form-urlencoded',
                                'Accept': '*/*',
                            },
                            transformRequest: function (obj) {
                                var str = [];
                                for (var p in obj)
                                    str.push(encodeURIComponent(p) + "=" +
                                        encodeURIComponent(obj[p]));
                                var foo = str.join("&");
                                // console.log("****RETURNING " + foo);
                                ZMDataModel.zmDebug("MonitorCtrl: parmeters constructed: " + foo);
                                return foo;
                            },
                            data: {
                                'Monitor[Function]': $scope.monfunc.myfunc,
                                'Monitor[Enabled]': isEnabled,
                            }

                        })

                        // I am not restarting ZM after monitor change

                        .success(function () {
                                $ionicLoading.hide();
                                ZMDataModel.zmDebug("MonitorCtrl: Not restarting ZM - Make sure you have the patch installed in MonitorsController.php or this won't work");
                                doRefresh();
                                /* ZMDataModel.zmDebug ("MonitorCtrl: Restarting ZM");
                                 $ionicLoading.show({
                                     template: "Successfully changed Monitor. Please wait, restarting ZoneMinder...",
                                     noBackdrop: true,
                                     duration: zm.largeHttpTimeout,
                                 });
                                 $http.post(apiRestart)
                                     .then(function (success) {
                                             $ionicLoading.hide();
                                             var refresh = ZMDataModel.getMonitors(1);
                                             refresh.then(function (data) {
                                                 $scope.monitors = data;
                                                 $scope.$broadcast('scroll.refreshComplete');
                                             });

                                         },
                                         function (error) {
                                             $ionicLoading.hide();

                                         }
                                     );*/

                            })
                            .error(function (data, status, headers, config) {
                                ZMDataModel.zmDebug("MonitorCtrl: Error changing monitor " + JSON.stringify(data));
                                $ionicLoading.hide();
                                $ionicLoading.show({
                                    template: "Error changing Monitor. Please check ZM logs...",
                                    noBackdrop: true,
                                    duration: 3000,
                                });
                            });

                    }



                },
                ]
        });

    };



    // same logic as EventCtrl.js
    $scope.finishedLoadingImage = function () {
       // console.log("***Monitor image FINISHED Loading***");
        $ionicLoading.hide();
    };


    $scope.$on('$ionicView.loaded', function () {
      //  console.log("**VIEW ** Monitor Ctrl Loaded");
    });





    //-------------------------------------------------------------------------
    // Lets make sure we set screen dim properly as we enter
    // The problem is we enter other states before we leave previous states
    // from a callback perspective in ionic, so we really can't predictably
    // reset power state on exit as if it is called after we enter another
    // state, that effectively overwrites current view power management needs
    //------------------------------------------------------------------------
    $scope.$on('$ionicView.enter', function () {
       // console.log("**VIEW ** Monitor Ctrl Entered");
        ZMDataModel.setAwake(false);
    });

    $scope.$on('$ionicView.leave', function () {
       // console.log("**VIEW ** Monitor Ctrl Left, force removing modal");
        if ($scope.modal) $scope.modal.remove();
    });

    $scope.$on('$ionicView.unloaded', function () {
       // console.log("**VIEW ** Monitor Ctrl Unloaded");
    });

    $scope.openModal = function (mid, controllable, controlid, connKey) {
        ZMDataModel.zmDebug("MonitorCtrl:Open Monitor Modal with monitor Id=" + mid +
            " and Controllable:" + controllable + " with control ID:" + controlid);


        $scope.monitorId = mid;
        $scope.monitorName = ZMDataModel.getMonitorName(mid);
        $scope.LoginData = ZMDataModel.getLogin();
        $scope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
        $rootScope.rand = Math.floor(Math.random() * (999999 - 111111 + 1)) + 111111;
        $scope.connKey = connKey;

        $scope.ptzMoveCommand = "";
         $scope.presetOn = false;
        
        
        

        // This is a modal to show the monitor footage
        // We need to switch to always awake if set so the feed doesn't get interrupted
        ZMDataModel.setAwake(ZMDataModel.getKeepAwake());

        // if its controllable, lets get the control command
        if (controllable == '1') {
            
            var apiurl = $scope.LoginData.apiurl;
            var myurl = apiurl + "/controls/" + controlid + ".json";
           // console.log("getting control details:" + myurl);

            $http.get(myurl)
                .success(function (data) {

                    $scope.ptzMoveCommand = "move"; // start with as move;
                    $scope.ptzStopCommand = "";


                    if (data.control.Control.CanMoveRel == '1')
                    {
                        $scope.ptzMoveCommand = "moveRel";
                        $scope.ptzStopCommand = "moveStop";
                    }

                    // Prefer con over rel if both enabled
                    // I've tested con
                    if (data.control.Control.CanMoveCon == '1')
                    {
                        $scope.ptzMoveCommand = "moveCon";
                        $scope.ptzStopCommand = "moveStop";
                    }
            
                    // presets
                    ZMDataModel.zmDebug ("Preset value is " +data.control.Control.HasPresets);
                
                    if (data.control.Control.HasPresets == '1')
                    {
                        $scope.ptzPresetCount = parseInt(data.control.Control.NumPresets);
                         //$scope.ptzPresetCount = 33;
                        ZMDataModel.zmDebug ("Number of presets is " + $scope.ptzPresetCount);
                        
                        $scope.ptzPresets = [];
                        for (var p=0; p<$scope.ptzPresetCount; p++)
                        {
                           $scope.ptzPresets.push ({name:(p+1).toString(), icon:'', cmd:"presetGoto"+(p+1).toString()});
                           // $scope.ptzPresets[p].name = "Arjun " + p;
                          //  console.log ("Name to " + $scope.ptzPresets[p].name);
                        }
                        
                        if (data.control.Control.HasHomePreset == '1')
                        {
                            $scope.ptzPresets.unshift({name:'', icon:"ion-ios-home", cmd:'presetHome'});
                            
                            $scope.ptzPresetCount++;
                        }
                        
                    }
                    

                   // console.log("***moveCommand: " + $scope.ptzMoveCommand);
                    ZMDataModel.zmLog("ControlDB reports PTZ command to be " + $scope.ptzMoveCommand  + " and " + $scope.ptzStopCommand);
                })
                .error(function (data) {
                   // console.log("** Error retrieving move PTZ command");
                    ZMDataModel.zmLog("Error retrieving PTZ command  " + JSON.stringify(data), "error");
                    ZMDataModel.displayBanner('error', ['did not get a valid PTZ response', 'Please try again']);
                    $scope.isControllable = '0';

                });

        }
        
        


        $ionicModal.fromTemplateUrl('templates/monitors-modal.html', {
                scope: $scope,
                animation: 'slide-in-up'
            })
            .then(function (modal) {
                $scope.modal = modal;

                $ionicLoading.show({
                    template: "please wait...",
                    noBackdrop: true,
                    duration: zm.loadingTimeout
                });
                $scope.isControllable = controllable;
                $scope.showPTZ = false;
                $scope.modal.show();
            });

    };

    $scope.closeModal = function () {
       // console.log("Close & Destroy Monitor Modal");
        
        // stop networking -nph-zms keeps sucking data
        
        // switch off awake, as liveview is finished
        ZMDataModel.setAwake(false);
        $scope.modal.remove();
        $timeout (function() {ZMDataModel.zmLog("MonitorCtrl:Stopping network pull...");if (ZMDataModel.isForceNetworkStop())  ZMDataModel.stopNetwork();},50);
        
        
    };
    //Cleanup the modal when we're done with it!
    $scope.$on('$destroy', function () {
        //console.log("Destroy Monitor Modal");
        $scope.modal.remove();
    });




    //-----------------------------------------------------------------------
    // Controller Main
    //-----------------------------------------------------------------------


    function monitorStateCheck() {
        var apiMonCheck;

        // The status is provided by zmdc.pl
        // "not running", "pending", "running since", "Unable to connect"
        var i;
        for (i = 0; i < $scope.monitors.length; i++) {
            (function (j) {
                $scope.monitors[j].Monitor.isRunningText = "...";
                $scope.monitors[j].Monitor.isRunning = "...";
                $scope.monitors[j].Monitor.color = zm.monitorCheckingColor;
                $scope.monitors[j].Monitor.char = "ion-checkmark-circled";
                apiMonCheck = loginData.apiurl + "/monitors/daemonStatus/id:" + $scope.monitors[j].Monitor.Id + "/daemon:zmc.json";
                ZMDataModel.zmDebug("MonitorCtrl:monitorStateCheck: " + apiMonCheck);
                //console.log("**** ZMC CHECK " + apiMonCheck);
                $http.get(apiMonCheck)
                    .success(function (data) {
                        ZMDataModel.zmDebug("MonitorCtrl: monitor check state returned: " + JSON.stringify(data));
                        if (data.statustext.indexOf("not running") > -1) {
                            $scope.monitors[j].Monitor.isRunning = "false";
                            $scope.monitors[j].Monitor.color = zm.monitorNotRunningColor;
                            $scope.monitors[j].Monitor.char = "ion-close-circled";
                        } else if (data.statustext.indexOf("pending") > -1) {
                            $scope.monitors[j].Monitor.isRunning = "pending";
                            $scope.monitors[j].Monitor.color = zm.monitorPendingColor;
                        } else if (data.statustext.indexOf("running since") > -1) {
                            $scope.monitors[j].Monitor.isRunning = "true";
                            $scope.monitors[j].Monitor.color = zm.monitorRunningColor;
                        } else if (data.statustext.indexOf("Unable to connect") > -1) {
                            $scope.monitors[j].Monitor.isRunning = "false";
                            $scope.monitors[j].Monitor.color = zm.monitorNotRunningColor;
                            $scope.monitors[j].Monitor.char = "ion-close-circled";
                        }


                        $scope.monitors[j].Monitor.isRunningText = data.statustext;
                    })
                    .error(function (data) {
                        ZMDataModel.zmDebug("MonitorCtrl: Error->monitor check state returned: " +
                            JSON.stringify(data));
                        ZMDataModel.displayBanner('error', ['error retrieving state', 'Please try again']);
                        $scope.monitors[j].Monitor.isRunning = "error";
                        $scope.monitors[j].Monitor.color = zm.monitorErrorColor;
                        $scope.monitors[j].Monitor.char = "ion-help-circled";
                    });


            })(i);
        }
    }


    function doRefresh() {
        $scope.monitors = [];

        var refresh = ZMDataModel.getMonitors(1);

        refresh.then(function (data) {
            $scope.monitors = data;
            monitorStateCheck();
            $scope.$broadcast('scroll.refreshComplete');
        });
    }

    $scope.doRefresh = function () {
        //console.log("***Pull to Refresh");
        doRefresh();


    };


}]);