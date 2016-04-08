import {Injectable, Injector, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

export interface Notification {
	message: string,
	type: boolean
}


@Injectable()
export class AuthService {
	notification$: Observable<Notification>;
	private observer: Observer<Notification>;

	baseUri: string = 'http://localhost:5000/api';
	tokenId: string = 'mj-token-id';

	constructor(private http: Http) {
		this.notification$ = new Observable<Notification>(observer => this.observer = observer).share();
	}

	saveJwt(jwt: string): void {
    if(jwt) {
      localStorage.setItem(this.tokenId, jwt);
    }
  }

  deleteJwt(): void {
		localStorage.removeItem(this.tokenId);
  }

  tokenExists(): [boolean, string] {
  	let jwt = localStorage.getItem(this.tokenId);
		if (typeof jwt !== 'undefined' && jwt !== null) {
			return [true, jwt];
		} else {
			return [false, undefined];
		}
  }

  getAuthHeader(): any {
		let [jwtExists, jwt] = this.tokenExists();
		if (jwtExists) {
			let authHeader = new Headers();
			authHeader.append('Content-Type', 'application/json');
			authHeader.append('Authorization', `Bearer ${jwt}`);

			return authHeader;
		} else {
			return false;
		}
  }

  saveSession(session: {}): void {
		localStorage.setItem('session', JSON.stringify(session));
  }

  deleteSession(): void {
		localStorage.removeItem('session');
  }

  getSession(): [boolean, {}] {
		let session = localStorage.getItem('session');
		if (typeof session !== 'undefined' && session !== null) {
			return [true, session];
		} else {
			return [false, undefined];
		}
  }

	authenticate({username, password}): void {
		let packet = JSON.stringify({
			username: username,
			password: password
		});

		let headers = new Headers();
		headers.append('Content-Type', 'application/json');

		this.http.post(`${this.baseUri}/authenticate/`, packet, {
			headers: headers
		})
		.map(res => res.json())
		.subscribe(
			data => {
				if (data.success && ("token" in data) && ("session" in data)) {
					this.saveJwt(data.token);
					this.saveSession(data.session);
				} else {
					this.deleteJwt();
					this.deleteSession();
				}

				this.observer.next({
					message: data.message,
					type: data.success
				});
			},
			err => {
				this.observer.next({
					message: 'Error connecting to server',
					type: false
				})
			},
			() => {
				// console.log('bearer token', this.getAuthHeader())
			}
		);
	}
}