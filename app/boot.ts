/// <reference path="../node_modules/angular2/typings/browser.d.ts" />

import {MountNode} from './app.component';
import {bootstrap} from 'angular2/platform/browser';
import {ROUTER_PROVIDERS} from 'angular2/router';
import {HTTP_PROVIDERS, HTTP_BINDINGS} from 'angular2/http';

import {SegmentViewService} from './profile/segment.service';
import {TemplateService} from './templates/template.service';
import {SegmentService} from './segments/segment.service';
import {NotificationService} from './notification.service';
import {AuthService} from './auth/auth.service';

bootstrap(MountNode, [
	ROUTER_PROVIDERS, HTTP_PROVIDERS, HTTP_BINDINGS, 
	AuthService, SegmentViewService, TemplateService, SegmentService, NotificationService
]);