/*

	DataManager Module

*/

const 	low = require('lowdb'), 
		FileSync = require('lowdb/adapters/FileSync'),
		path = require('path'),
		events = require('events'),
		axios = require('axios'),
		{ app } = require('electron'),
		adapter = new FileSync(path.join(app.getPath('appData'), app.getName(), 'livemetools_db.json')),
		db = low(adapter);

var		index = 0;

class DataManager {

    constructor() {
    	this._favorites = [];
    	this._visited = [];

        this.events = new (events.EventEmitter)();
    }

	_emit(eventName, object) {
		this.events.emit(eventName, object);
	}    

	ResetDB() {
		db.defaults({
			favorites: [],
			visited: [],
			downloaded: []
		}).write();
	}

	commitDatabases() {
		db.write();
	}



	/*
		Favorites
	*/
	addFavorite(e) {

		db.get('favorites')
			.push({
				id: e.uid,
				face: e.face,
				nickname: e.nickname,
				sex: e.sex,
				level: e.level,
				video_count: e.video_count,
				usign: e.usign,
				stars: e.stars
			})
			.write();

		var list = db.get('favorites').cloneDeep().value();
		this._emit('refresh_favorites', list);
	}
	loadFavorites() {
		var list = db.get('favorites').cloneDeep().value();
		this._emit('refresh_favorites', list);
	}
	removeFavorite(u) {
		db.get('favorites').remove({ id: u.uid }).write();
	}
	updateFavorites() {
		var count = db.get('favorites').size().value();
		if (count == index) {
			index = 0;
		} 

		index = 0;
		this._updateFavorites();
	
	}
	_updateFavorites() {
		axios.get('http://live.ksmobile.net/user/getinfo',{
			params: { 
				userid: db.get('favorites['+index+'].id').value()
			}
		}).then(function(resp) {
			var j = resp.data.data.user;

			if (resp.data.status == 200) {
				db.get('favorites').find({ id: j.user_info.uid })
					.assign({ face: 	j.user_info.face })
					.assign({ nickname: j.user_info.nickname })
					.assign({ usign: 	j.user_info.usign })
					.assign({ level: 	j.user_info.level })
					.assign({ stars: 	j.user_info.stars })
					.assign({ sex: 		j.user_info.sex > -1 ? ( j.user_info.sex > 0 ? 'male' : 'female') : '' })
					.assign({ video_count: 	j.count_info.video_count })
					.write();
			} 

		});
		index++;

		var count = db.get('favorites').size().value();
		if (count == index) {
			index = 0;
			this.loadFavorites();
		} else {
			this._updateFavorites();
		}

	}

	isInFavorites(e) {
		var t = db.get('favorites').find({ id: e }).value();
		if (t == 'undefined' || typeof t == 'undefined' || t == null) return false; 
		return true;
	}


	importFavorites(f) {

	}
	exportFavorites(f) {

	}



	/*
		Tracking of Visited UserIds
	*/
	addTrackedVisited(e) {
		db.get('visited').push({
			id: e,
			dt: (new Date().getTime() / 1000) + 86400
		}).write();
	}
	wasVisited(e) {
		var dt = new Date().getTime() / 1000, t = db.get('visited').find({ id: e }).value();
		if (t == 'undefined' || typeof t == 'undefined' || t == null) return false; 
		if ((dt - t.dt) > 0) {
			db.get('visited').remove({ id: e }).write();
			return false;
		} else {
			return true;
		}
	}
	expireVisited() {

	}


}

exports.DataManager = DataManager;
