"use strict";

var Service, Characteristic;

var crypto = require("crypto");
var Client = require('node-rest-client').Client;

module.exports = function(homebridge) {

  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;

  homebridge.registerAccessory("homebridge-api-switch", "APISwitch", APISwitch);
}

function APISwitch(log, config) {
  this.log = log;

  this.service = config.service;
  this.name = config.name;
  this.url = config.url;
  this.command = config.command;

  //if (config.sn){
  //    this.sn = config.sn;
  //} else {
  //    var shasum = crypto.createHash('sha1');
  //    shasum.update(this.name);
  //    this.sn = shasum.digest('base64');
  //    this.log('Computed SN ' + this.sn);
  //}

  this.client = new Client();
}

function parseBool(val) {
  if (1 == val){
    return true
  }else if (0 == val){
    return false
  }
  return val === true || val === "true"
}

APISwitch.prototype = {

    getPowerState: function (callback) {
        var requestUrl = this.url + "/switchStatus"
        this.log("Invoking " + requestUrl)
        this.client.get(requestUrl, function (data, response) {
          //this.log("Got state from server:")
          data = JSON.parse(data)
	  this.log("Got response from server:" + data.data.switchStatus);
          //this.log(data)
          //this.log(data.status)
          //this.log(data.status.power)
          var currentState = false
          if (data && data.data && data.data.switchStatus) {
            this.log('Parsing bool from ' + data.data.switchStatus)
            currentState = parseBool(data.data.switchStatus)
          }
          this.log('Setting current state: ' + currentState)
          callback(null, currentState);
        }.bind(this));
    },

    setPowerState: function(powerOn, callback) {

      this.log("Setting NAD power to " + powerOn);

      var method = "/switch?command=" + (powerOn ? this.command["on"] : this.command["off"])
      var requestUrl = this.url + method
      this.log("Invoking " + requestUrl)

      this.client.get(requestUrl, function (data, response) {
        this.log("Got response from server:" + data);
        callback();
      }.bind(this));

    },

    identify: function (callback) {
        this.log("Identify requested!");
        callback(); // success
    },

    getServices: function () {
        this.log("Configuring services");

        var informationService = new Service.AccessoryInformation();

        informationService
                .setCharacteristic(Characteristic.Manufacturer, "PianosaLab")
                .setCharacteristic(Characteristic.Model, "APISwitch")
                .setCharacteristic(Characteristic.SerialNumber, this.sn);

        this.service = new Service.Switch(this.name);
        this.service
                .getCharacteristic(Characteristic.On)
                .on('get', this.getPowerState.bind(this))
                .on('set', this.setPowerState.bind(this));


        return [this.service];
    }

}
