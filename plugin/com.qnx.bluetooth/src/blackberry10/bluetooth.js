/*
 * Copyright 2013  QNX Software Systems Limited
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
 * The abstraction layer for Bluetooth functionality
 */

var _pps = qnx.webplatform.pps,
	_pairedDevicesPPS,
	_controlPPS,
	_statusPPS,
	_servicesPPS,

	_pairedDevices = {},

	_serviceConnectedTrigger,
	_serviceDisconnectedTrigger,
	_newPairedDeviceTrigger,
	_pairingCompleteTrigger,
	_deviceDeletedTrigger;

/* TODO Please make sure that constants below are identical to ones in client.js*/
/* TODO Please make sure that constants below are identical to ones in client.js*/
/** To exchange Legacy pin (usually hardcoded) */
var LEGACY_PIN = "LEGACY_PIN",
	/** To allow remote device connect */
	AUTHORIZE = "AUTHORIZE",
	/** Request to display dialog to enter authorization passkey */
	PASS_KEY = "PASS_KEY",
	/** Request to display dialog to confirm displayed  passkey*/
	ACCEPT_PASS_KEY = "ACCEPT_PASS_KEY",
	/** Request to display dialog display passkey*/
	DISPLAY_PASS_KEY = "DISPLAY_PASS_KEY",
	/** Defines Handsfree Profile ID */
	SERVICE_HFP = "0x111E",
	/** Defines Message Access Profile ID */
	SERVICE_MAP = "0x1134",
	/** Defines Serial Port Profile ID */
	SERVICE_SPP = "0x1101",
	/** Defines Phonebook Access Profile ID */
	SERVICE_PBAP = "0x1130",
	/** Defines Personal Area Network ID */
	SERVICE_PAN = "0x1115",
	/** Defines Phonebook Access Profile ID */
	SERVICE_AVRCP = "0x110B",
	/** Defines All allowed Profiles ID for current device*/
	SERVICE_ALL = "ALL";

	/** Non-discoverable or connectable. */
	DEVICE_NOT_ACCESSIBLE = 0;
	/** General discoverable and connectable. */
	DEVICE_GENERAL_ACCESSIBLE = 1;
	/** Limited discoverable and connectable. */
	DEVICE_LIMITED_ACCESSIBLE = 2;
	/** Connectable but not discoverable. */
	DEVICE_CONNECTABLE_ONLY = 3;
	/** Discoverable but not connectable. */
	DEVICE_DISCOVERABLE_ONLY = 4;




/* TODO Please make sure that constants above are identical to ones in client.js*/

/**
 * Method called when object changes in paired_devices directory (new paired device available)
 * @param event {Object} The PPS event
 */
function onPairedDevice(event) {
	if (event && event.data && event.data.cod && event.data.name && event.data.paired != undefined && event.data.rssi) {
		var device = {
			mac:event.objName,
			cod:event.data.cod.replace(/(\r\n|\n|\r)/gm, ""), // TODO temp fix of the bug with garbage in JSON generated by PPS-Bluetooth, remove it when PPS-Bluetooth will be fixed
			name:event.data.name,
			paired:event.data.paired,
			rssi:event.data.rssi.replace(/(\r\n|\n|\r)/gm, "") // TODO temp fix of the bug with garbage in JSON generated by PPS-Bluetooth, remove it when PPS-Bluetooth will be fixed
		};

		// saving paired device in the list to maintain local copy
		_pairedDevices[device.mac] = device;

		if (_newPairedDeviceTrigger) {
			_newPairedDeviceTrigger(device);
		}
	}
}

/**
 * onChange event handler for status PPS object
 * convenience function to reduce size of init(), not to invoke from outside
 * @param event {Object} onChange event object containing event data from PPS
 * */
function onStatusPPSChange(event) {
	/* checking if all required field are present when event generated*/
	if (event && event.data && event.data.event) {
		var mac = event.data.data;
		switch (event.data.event) {
			/* Event indicated that one specified paired device deleted */
			case "BTMGR_EVENT_DEVICE_DELETED":
				// deleting device from local list of devices when it was deleted by pps-bluetooth from the list of paired devices
				delete _pairedDevices[mac];
				if (_deviceDeletedTrigger) {
					_deviceDeletedTrigger(mac);
				}
				break;
			/* Event indicated that one of the services is connected */
			case "BTMGR_EVENT_SERVICE_CONNECTED":
				if (_serviceConnectedTrigger && event.data.data2) {
					var triggerEvent = {mac:mac, serviceid:event.data.data2};
					_serviceConnectedTrigger(triggerEvent);
				}
				break;
			/* Event indicated that all allowed services connected */
			case "BTMGR_EVENT_CONNECT_ALL_SUCCESS":
				if (_serviceConnectedTrigger && mac) {
					var triggerEvent = {mac:mac, serviceid:SERVICE_ALL};
					_serviceConnectedTrigger(triggerEvent);
				}
				break;
			/* Event indicated that one of the services is disconnected */
			case "BTMGR_EVENT_SERVICE_DISCONNECTED":
				if (_serviceDisconnectedTrigger && event.data.data2) {
					var triggerEvent = {mac:mac, serviceid:event.data.data2};
					_serviceDisconnectedTrigger(triggerEvent);
				}
				break;
			/* Event indicated that all allowed services disconnected */
			case "BTMGR_EVENT_DISCONNECT_ALL_SUCCESS":
				if (_serviceDisconnectedTrigger) {
					var triggerEvent = {mac:mac, serviceid:SERVICE_ALL};
					_serviceDisconnectedTrigger(triggerEvent);
				}
				break;
			/* Indicates that Pairing completed successfully, also contains MAC of the paired device */
			case "BTMGR_EVENT_PAIRING_COMPLETE":
				if (_pairingCompleteTrigger) {
					_pairingCompleteTrigger(mac);
				}
				break;
		}
	}
}

/**
 * Event handler to process services object change event.
 * I return snapshot of the whole status object when change detected
 * */
function onServicesPPSChange() {

	var devices = {};
	if(_servicesPPS && _servicesPPS.data && _servicesPPS.data.services) {
		devices[SERVICE_HFP] = _servicesPPS.data.services['hfp'];
		devices[SERVICE_SPP] = _servicesPPS.data.services['spp'];
		devices[SERVICE_PBAP] = _servicesPPS.data.services['pbap'];
		devices[SERVICE_MAP] = _servicesPPS.data.services['map'];
		devices[SERVICE_PAN] = _servicesPPS.data.services['pan'];
		devices[SERVICE_AVRCP] = _servicesPPS.data.services['avrcp'];
	}
	//_serviceStateChanged(devices);
}

/**
 * Exports are the publicly accessible functions
 */
module.exports = {
	/**
	 * Sets the trigger function to call when a service connected fired
	 * @param trigger {Function} The trigger function to call when the event is fired
	 */
	setServiceConnectedTrigger:function (trigger) {
		_serviceConnectedTrigger = trigger;
	},

	/**
	 * Sets the trigger function to call when service disconnected fired
	 * @param trigger {Function} The trigger function to call when the event is fired
	 */
	setServiceDisconnectedTrigger:function (trigger) {
		_serviceDisconnectedTrigger = trigger;
	},

	/**
	 * Sets the trigger function to call when a Bluetooth new paired device event is fired
	 * @param trigger {Function} The trigger function to call when the event is fired
	 */
	setNewPairedDeviceTrigger:function (trigger) {
		_newPairedDeviceTrigger = trigger;
	},

	/**
	 * Sets the trigger function to call when paired device deleted event fired
	 * @param trigger {Function} The trigger function to call when the event is fired
	 */
	setDeviceDeletedTrigger:function (trigger) {
		_deviceDeletedTrigger = trigger;
	},

	/**
	 * Sets the trigger function to call when a Bluetooth pairing complete event is fired
	 * @param trigger {Function} The trigger function to call when the event is fired
	 */
	setPairingCompleteTrigger:function (trigger) {
		_pairingCompleteTrigger = trigger;
	},

	/**
	 * Initializes the extension,
	 * open and initialise required PPS object and event handlers
	 */
	init:function () {

		/* Initialise PPS object which populated when user Paired with device */
		_pairedDevicesPPS = _pps.create("/pps/services/bluetooth/paired_devices/.all", _pps.PPSMode.DELTA);

		/* We have to monitor onFirstReadComplete and onNewData event to capture all devices */
		_pairedDevicesPPS.onFirstReadComplete = onPairedDevice;
		_pairedDevicesPPS.onNewData = onPairedDevice;

		_pairedDevicesPPS.open(_pps.FileMode.RDONLY);

		/* Initialise PPS object to send commands and data to the PPS-Bluetooth */
		_controlPPS = _pps.create("/pps/services/bluetooth/control", _pps.PPSMode.DELTA);
		_controlPPS.open(_pps.FileMode.WRONLY);

		/* Initialise PPS object responsible for notifying about BluettothStake state changes */
		_statusPPS = _pps.create("/pps/services/bluetooth/status", _pps.PPSMode.DELTA);
		_statusPPS.onNewData = onStatusPPSChange;
		_statusPPS.open(_pps.FileMode.RDONLY);

		/* Initialise PPS object which indicates what services currently connected and what is MAC of devices */
		_servicesPPS = _pps.create("/pps/services/bluetooth/services", _pps.PPSMode.DELTA);
		_servicesPPS.onNewData = onServicesPPSChange;
		_servicesPPS.open(_pps.FileMode.RDONLY);

	},

	/**
	 * Connects to specified service on device with specified MAC address
	 * @param service {String} Service identifier
	 * @param mac {String} MAC address of the device
	 */
	connectService:function (service, mac) {
		if (service && mac) {
			if (service == SERVICE_ALL) {
				_controlPPS.write({
					"command":"connect_all",
					"data":mac
				});
			} else {
				_controlPPS.write({
					"command":"connect_service",
					"data":mac,
					"data2":service
				});
			}
		}
	},

	/**
	 * Return list of paired devices.
	 *
	 * TODO This has to be changed when JNEXT extension would be able to retrieve values from .all
	 * right now I have to keep track of it on extension side.
	 *
	 * @returns {Object} The list of currently paired devices
	 */
	getPaired:function () {
		return _pairedDevices;
	},

	/**
	 * Gets a list of connected devices for bluetooth services.
	 * @param service {String} (optional) The bluetooth service.
	 */
	getConnectedDevices: function(service) {
		var devices = {};
		if(_servicesPPS && _servicesPPS.data && _servicesPPS.data.services) {
			if(!service || service == SERVICE_HFP || service == SERVICE_ALL) {
				devices[SERVICE_HFP] = _servicesPPS.data.services['hfp'];
			}
			if(!service || service == SERVICE_SPP || service == SERVICE_ALL) {
				devices[SERVICE_SPP] = _servicesPPS.data.services['spp'];
			}
			if(!service || service == SERVICE_PBAP || service == SERVICE_ALL) {
				devices[SERVICE_PBAP] = _servicesPPS.data.services['pbap'];
			}
			if(!service || service == SERVICE_MAP || service == SERVICE_ALL) {
				devices[SERVICE_MAP] = _servicesPPS.data.services['map'];
			}
			if(!service || service == SERVICE_PAN || service == SERVICE_ALL) {
				devices[SERVICE_PAN] = _servicesPPS.data.services['pan'];
			}
			if(!service || service == SERVICE_AVRCP || service == SERVICE_ALL) {
				devices[SERVICE_AVRCP] = _servicesPPS.data.services['avrcp'];
			}
		}
		return devices;
	},

};
