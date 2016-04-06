/// <reference path="../node_modules/angular2/typings/browser.d.ts" />

import {MountNode} from './app.component';
import {bootstrap} from 'angular2/platform/browser';
import {ROUTER_PROVIDERS} from 'angular2/router';
import {HTTP_PROVIDERS, HTTP_BINDINGS} from 'angular2/http';

import {SegmentViewService} from './profile/segment.service';
import {TemplateService} from './templates/template.service';
import {SegmentService} from './segments/segment.service';

bootstrap(MountNode, [
	ROUTER_PROVIDERS, HTTP_PROVIDERS, HTTP_BINDINGS, 
	SegmentViewService, TemplateService, SegmentService
]);