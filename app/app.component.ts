import {Component, Input, Output, EventEmitter, OnInit, Injectable, Injector} from "angular2/core";
import {RouteConfig, RouterOutlet, RouterLink, Router, RouteParams, Redirect} from 'angular2/router';

import {ProfileViewport} from './profile/profile.component';
import {User, UserType} from './interfaces/interface';
import {AuthComponent, LogoutComponent} from './auth/auth.component';
import {TemplateViewport} from './templates/template.component';
import {SegmentViewport} from './segments/segment.component';
import {PreferencesViewport} from './preferences/preference.component';

import {NotificationService, Notification, NotificationModalService, NotifyModal, NotifyTarget} from './notification.service';
import {LayoutHeader} from './layouts/header.layout';

import {AuthService} from './auth/auth.service';
import {NotifierService} from './services/notifier.service';

import {Http, Response, Headers} from 'angular2/http';
import {Observable} from 'rxjs/Rx';
import 'rxjs/Rx';

@Component({
	selector: 'notification-modal',
	template: `
		<div class="overlay" *ngIf="show && notifyModal"></div>
		<div class="notification__modal" *ngIf="show && notifyModal">
			<button class="icon-close close__modal" (click)="cancel()"></button>
			<h4>{{notifyModal.heading}}</h4>
			<section class="message__modal">
				{{notifyModal.message}}
			</section>
			<section class="controls__modal">
				<button class="button" [ngClass]="{type__3: !notifyModal.error, type__1: notifyModal.error}" (click)="action()">
					<span class="icon-done"></span>
					{{notifyModal.display}}
				</button>
				<button class="button type__4" (click)="cancel()">
					<span class="icon-close"></span>
					Cancel
				</button>
			</section>
		</div>
	`
})
class NotificationModal implements OnInit {
	show: boolean = false;
	notifyModalObr$: Observable<NotifyModal>;
	notifyModal: NotifyModal;
	notifyTarget: NotifyTarget;

	constructor(
		private NMService: NotificationModalService
	) {
	}

	ngOnInit() {
		this.notifyModalObr$ = this.NMService.notifyModalObr$;
		this.notifyModalObr$.subscribe(
			(data) => {
				this.notifyModal = data;
				this.show = true;
			});
	}

	action() {
		this.notifyTarget = {
			target: this.notifyModal.target,
			payload: true
		};
		this.NMService.notify(this.notifyTarget);
		this.close();
	}

	cancel() {
		this.notifyTarget = {
			target: this.notifyModal.target,
			payload: false
		};
		this.NMService.notify(this.notifyTarget);
		this.close();
	}

	close() {
		this.show = false;
	}
}

@Component({
	selector: 'notification-component',
	template: `
		<div *ngIf="notification" class="notification__component" (click)="hide()" [ngClass]="{show: notification.type, red: notification.error}">
			<div class="notification__bar"></div>
			<strong>Notification</strong>
			<div>
				{{notification.message}}
			</div>
		</div>
	`
})
class NotificationComponent  implements OnInit {
	notification: Notification;
	notification$: Observable<Notification>;

	constructor(
		private notificationService: NotificationService,
	) {
	}

	hide() {
		this.notification.type = false;
	}

	ngOnInit() {
		this.notification$ = this.notificationService.notification$;
		this.notification$.subscribe(
			(data) => {
				this.notification = data;
			}
		)
	}
}


@Component({
	selector: 'mount-node',
	template: `
		<div class="app__wrap">
			<layout-header></layout-header>
			<router-outlet></router-outlet>
		</div>
		<notification-modal></notification-modal>
		<notification-component></notification-component>
	`,
	directives: [RouterOutlet, RouterLink, LayoutHeader, NotificationComponent, NotificationModal]
})
@RouteConfig([
	{ path: '/', name: 'AuthComponent', component: AuthComponent, useAsDefault: true },
	{ path: '/logout', name: 'LogoutComponent', component: LogoutComponent },
	{ path: '/calendar/...', name: 'ProfileViewport', component: ProfileViewport },
	{ path: '/templates/...', name: 'TemplateViewport', component: TemplateViewport },
	{ path: '/segments/...', name: 'SegmentViewport', component: SegmentViewport },
	{ path: '/preferences', name: 'PreferencesViewport', component: PreferencesViewport }
])
export class MountNode {
	constructor(
		private router: Router,
		private authService: AuthService,
		private notifierService: NotifierService		
	){}

	ngOnInit() {
		let [tokenExists, _] = this.authService.tokenExists();
		if (!tokenExists) {
			this.router.navigateByUrl('/');
		}
	}
}





/ * end */
