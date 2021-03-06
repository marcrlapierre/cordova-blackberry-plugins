/*
 * Copyright 2013-2014.
 * QNX Software Systems Limited. All rights reserved.
 * 
 * Licensed under the Apache License, Version 2.0 (the "License"). You
 * may not reproduce, modify or distribute this software except in
 * compliance with the License. You may obtain a copy of the License
 * at: http://www.apache.org/licenses/LICENSE-2.0.
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTIES OF ANY KIND, either express or implied.
 * This file may contain contributions from others, either as
 * contributors under the License or as licensors under other terms.
 * Please review this entire file for other proprietary rights or license
 * notices, as well as the applicable QNX License Guide at
 * http://www.qnx.com/legal/licensing/document_archive/current_matrix.pdf
 * for other information.
 */

/**
 * 
 * @module qnx.bluetooth
 * @deprecated
 * @static
 * @description Manage Bluetooth operations.
 *
 */


var _ID = "com.qnx.bluetooth",
	_events = ["bluetoothserviceconnected", "bluetoothservicedisconnected", "bluetoothnewpaireddevice", "bluetoothpairingcomplete", "bluetoothpaireddevicedeleted"];


_events.map(function (eventName) {
	var channel = cordova.addDocumentEventHandler(eventName),
		success = function (data) {
			channel.fire(data);
		},
		fail = function (error) {
			console.log("Error initializing " + eventName + " listener: ", error);
		};

	channel.onHasSubscribersChange = function () {
		if (this.numHandlers === 1) {
			window.cordova.exec(success, fail, _ID, "startEvent", {eventName: eventName});
		} else if (this.numHandlers === 0) {
			window.cordova.exec(null, null, _ID, "stopEvent", {eventName: eventName});
		}
	};
});


/*
 * Exports are the publicly accessible functions.
 */
module.exports = {
	/* Ensure that the constants below are identical to ones in bluetooth.js.*/

	/** To exchange legacy PINs (usually hardcoded). */
	LEGACY_PIN:"LEGACY_PIN",
	/** To allow remote device connections. */
	AUTHORIZE:"AUTHORIZE",
	/** Request to display dialog to enter authorization passkey. */
	PASS_KEY:"PASS_KEY",
	/** Request to display dialog to confirm displayed  passkey. */
	ACCEPT_PASS_KEY:"ACCEPT_PASS_KEY",
	/** Request to display dialog display passkey. */
	DISPLAY_PASS_KEY:"DISPLAY_PASS_KEY",
	/** Defines the Hands-Free Profile ID. */
	SERVICE_HFP:"0x111E",
	/** Defines the Message Access Profile ID. */
	SERVICE_MAP:"0x1134",
	/** Defines the Serial Port Profile ID. */
	SERVICE_SPP:"0x1101",
	/** Defines the Phonebook Access Profile ID. */
	SERVICE_PBAP:"0x1130",
	/** Defines the Personal Area Network ID. */
	SERVICE_PAN : "0x1115",
	/** Defines the Advanced Audio Distribution Profile, Audio, or Video Remote Control Profile ID. */
	SERVICE_AVRCP : "0x110B",
	/** Defines all the allowed Profile IDs for current device. */
	SERVICE_ALL:"ALL",

	/** Not discoverable or connectable. */
	DEVICE_NOT_ACCESSIBLE:0,
	/** General discoverable and connectable. */
	DEVICE_GENERAL_ACCESSIBLE:1,
	/** Limited discoverable and connectable. */
	DEVICE_LIMITED_ACCESSIBLE:2,
	/** Connectable but not discoverable. */
	DEVICE_CONNECTABLE_ONLY:3,
	/** Discoverable but not connectable. */
	DEVICE_DISCOVERABLE_ONLY:4,


	/**
	 * @description Connect to the specified service on device with the specified MAC address.
	 * @param {String} service The service identifier.
	 * @param {String} mac The MAC address of the device.
	 * */
	connectService:function (service, mac) {
		window.cordova.exec(null, null, _ID, 'connectService', { service:service, mac:mac });
	},

	/**
	 * @description Get a list of paired devices.
	 * @return {Object} The currently paired device, otherwise <code>null</code> 
	 *         if no device is paired.
	 */
	getPaired:function () {
   		var value = null,
			success = function (data, response) {
				value = data;
			},
			fail = function (data, response) {
				throw data;
			};

		try {
			window.cordova.exec(success, fail, _ID, 'getPaired', null);
		} catch (e) {
			console.error(e);
		}
		return value;
	},

	/**
	 * @description Get a list of connected devices for Bluetooth services.
	 * @param {String} [service] The Bluetooth service (e.g., <code>SERVICE_HFP</code>).
	 */
	getConnectedDevices:function (service) {
   		var value = null,
   			args = (typeof service == "string") ? { service: service } : null ,
			success = function (data, response) {
				value = data;
			},
			fail = function (data, response) {
				throw data;
			};

		try {
			window.cordova.exec(success, fail, _ID, 'getConnectedDevices', args);
		} catch (e) {
			console.error(e);
		}

		return value;
	},
};