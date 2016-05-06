import {Injectable, Inject, Injector, OnInit, NgZone} from "angular2/core";
import {Http, Response, Headers} from 'angular2/http';

import {Observable} from 'rxjs/Observable';
import {Observer} from 'rxjs/Observer';
import 'rxjs/add/operator/share';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';

import {AuthService} from '../auth/auth.service';


@Injectable()
export class SearchService {
	authService: AuthService;

	constructor(
		private http: Http,
		@Inject(AuthService) AuthService
	) {
		this.authService = AuthService;
	}

	search(q: string) {
		return this.http.post(`${this.authService.baseUri}/search/`, JSON.stringify({
			q: q
		}), {
			headers: this.authService.getAuthHeader()
		})
		.map(res => res.json())
		.toPromise();
	}
}