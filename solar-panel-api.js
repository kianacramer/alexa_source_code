var request = require('request-promise'); 

api_key = 'hUeKIgQuZMkhyIP0MR8pAZ2Ea5HYAt5HuHVff345' 
api_url = 'https://developer.nrel.gov/api/pvwatts/v5.json' 

module.exports = {
	
	solarPanelDataRequest: function(userLocation){
		var parameters = {'api_key': api_key, 'address': userLocation, 'system_capacity': 4, 'azimuth': 180, 
					'tilt': 40, 'array_type': 1, 'module_type': 1, 'losses': 10, 'radius': 0, 'timeframe': 'hourly'}			

		return request({url: api_url, qs: parameters})
	}
}


	




