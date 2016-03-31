import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams, Redirect} from 'angular2/router';
import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

import {ProfileViewport} from './profile/profile.component';
import {User, UserType} from './interfaces/interface';



@Component({
	template: `
		<div class="auth">
			<h2>Hi! Login</h2>
			<form (ngSubmit)="auth()">
				<div class="form__group">
					<label for="">Username:</label>
					<input type="text" [(ngModel)]="username" id="" placeholder="tovelo" />
				</div>

				<div class="form__group">
					<label for="">Password:</label>
					<input type="password" [(ngModel)]="password" id="" placeholder="dummy" />
				</div>
				
				<div class="form__group">
					<button type="submit">Login</button>
				</div>
			</form>

			{{message}}
		</div>
	`
})
class AuthComponent implements OnInit {
	username: string = '';
	password: string = '';
	message: string = '';

	constructor(private http: Http,
							private router: Router) {}

	// 	// http.get('http://localhost:5000/api/').map(res => this.message = res.json().data)
	// }

	auth(): void {
		let username = this.username.trim(),
				password = this.password.trim();

		if (username.length > 0 && password.length > 0) {
			var packet = "username=" + username + "&password=" + password;
			var headers = new Headers();
			headers.append('Content-Type', 'application/x-www-form-urlencoded');

			this.http.post('http://localhost:5000/api/authenticate/', packet, {
				headers: headers
			})
				.map(res => res.json())
				.subscribe(
				data => this.router.navigateByUrl('/calendar/127484'),
				// err => this.logError(err),
				() => console.log('Authentication Complete')
				);


		} else {
			this.message = `hey! username and password not valid`
		}
	}

	ngOnInit() {
		// this.http.get('http://localhost:5000/api/').map(res => res.json().data)

		this.http.get('http://localhost:5000/api/')
			.map(res => res.text())
			.subscribe(
      data => this.message = data,
      () => console.log('Complete')
			);
	}
}



@Component({
	selector: 'mount-node',
	template: `
		<div class="app__wrap">
			<router-outlet></router-outlet>
		</div>
	`,
	directives: [RouterOutlet, RouterLink]
})
@RouteConfig([
	{ path: '/', name: 'AuthComponent', component: AuthComponent, useAsDefault: true },
	{ path: '/calendar/...', name: 'ProfileViewport', component: ProfileViewport },
])
export class MountNode {
}





/ * end */
