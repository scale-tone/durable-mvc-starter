(this["webpackJsonpdurable-mvc-starter-ui"]=this["webpackJsonpdurable-mvc-starter-ui"]||[]).push([[0],{32:function(t,e,n){},38:function(t,e,n){"use strict";n.r(e);var i=n(1),a=n.n(i),o=n(13),r=n.n(o),s=(n(32),n(6)),c=n(8),l=n(15),y=n(14),u=n(26),h=n(27),g=n(2),f=n(5),d=n(16),v=function(){function t(){Object(s.a)(this,t),this.entityName="",this.entityKey="",this.version=0,this.stateDiff=[],this.isEntityDestructed=!1}return Object(c.a)(t,null,[{key:"GetEntityId",value:function(e){return t.FormatEntityId(e.entityName,e.entityKey)}},{key:"FormatEntityId",value:function(t,e){return"@".concat(t,"@").concat(e)}}]),t}(),S=function(){function t(){Object(s.a)(this,t),this.version=0,this.state={}}return Object(c.a)(t,null,[{key:"GetEntityNameAndKey",value:function(t){var e=/@([^@]+)@(.+)/.exec(t);return{entityNameLowerCase:e?e[1]:"",entityKey:e?e[2]:""}}}]),t}(),E=n(17),m=n(10),p="/a/p/i",C=function(t){Object(l.a)(n,t);var e=Object(y.a)(n);function n(t){var i;return Object(s.a)(this,n),(i=e.call(this,f.d.instance))._configFabric=t,i}return Object(c.a)(n,[{key:"send",value:function(t){var e=this;if(t.url.includes(p)){var i=this._configFabric();if(i.accessTokenFactory)return i.accessTokenFactory().then((function(i){return t.headers={},t.headers.Authorization="Bearer "+i,Object(E.a)(Object(m.a)(n.prototype),"send",e).call(e,t)}));if(i.fakeUserNamePromise)return i.fakeUserNamePromise.then((function(i){return i&&(t.headers={},t.headers["x-ms-client-principal-name"]=i),Object(E.a)(Object(m.a)(n.prototype),"send",e).call(e,t)}))}return Object(E.a)(Object(m.a)(n.prototype),"send",this).call(this,t)}}]),n}(f.a),b=function(){function t(e){Object(s.a)(this,t),this._maxKnownEntityIdsToPersist=e,this.States={},this.LocalStorageKnownIdsKey="DurableEntitySetKnownEntityIds"}return Object(c.a)(t,[{key:"getState",value:function(t){return this.States[t]}},{key:"getStatesCopy",value:function(){return Object.assign({},this.States)}},{key:"addOrUpdateState",value:function(t,e){if(this.States[t]=e,localStorage){var n=Object.keys(this.States).slice(0,this._maxKnownEntityIdsToPersist());localStorage.setItem(this.LocalStorageKnownIdsKey,JSON.stringify(n))}}},{key:"removeState",value:function(t){if(delete this.States[t],localStorage){var e=Object.keys(this.States).slice(0,this._maxKnownEntityIdsToPersist());localStorage.setItem(this.LocalStorageKnownIdsKey,JSON.stringify(e))}}},{key:"getStoredEntityIds",value:function(t){if(!localStorage)return[];var e=localStorage.getItem(this.LocalStorageKnownIdsKey);return e?JSON.parse(e).filter((function(e){return S.GetEntityNameAndKey(e).entityNameLowerCase===t})):[]}},{key:"removeStoredEntityIds",value:function(t){localStorage&&localStorage.removeItem(this.LocalStorageKnownIdsKey)}}]),t}(),O=function(){function t(e){var n=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];Object(s.a)(this,t),this._entityNameLowerCase=e,this.items=[],this._entityNameLowerCase=this._entityNameLowerCase.toLowerCase(),Object(g.m)(this,{items:g.n}),n&&this.attachAllEntities()}return Object(c.a)(t,[{key:"attachAllEntities",value:function(){var e=this;return t.initSignalR(),t.EntitySets[this._entityNameLowerCase]=this.items,t.fetchAndApplyKnownEntityStates(this._entityNameLowerCase).then((function(){return t.fetchAndApplyAllEntityStates(e._entityNameLowerCase)}))}},{key:"attachEntity",value:function(e){var n=v.FormatEntityId(this._entityNameLowerCase,e);t.EntityStates.getState(n)||(t.EntitySets[n]=this.items,t.attachEntity(this._entityNameLowerCase,e,void 0))}},{key:"createEntity",value:function(e){t.createEntity(this._entityNameLowerCase,e,void 0)}},{key:"signalEntity",value:function(e,n,i){return t.signalEntity(this._entityNameLowerCase,e,n,i)}},{key:"callEntity",value:function(e,n,i){return t.callEntity(this._entityNameLowerCase,e,n,i)}},{key:"updateEntityMetadata",value:function(e,n){return t.updateEntityMetadata(this._entityNameLowerCase,e,n)}}],[{key:"attachEntity",value:function(e,n,i){t.initSignalR();var a=e.toLowerCase(),o=this.EntityStates.getState(v.FormatEntityId(a,n));return o?o.state:(i&&Object(g.l)(i),this.fetchAndApplyEntityState(a,n,0,0,i),i)}},{key:"createEntity",value:function(t,e,n){return this.updateEntityMetadata(t,e,{}),this.attachEntity(t,e,n)}},{key:"signalEntity",value:function(t,e,n,i){var a=t.toLowerCase(),o="".concat(p,"/entities/").concat(a,"/").concat(e,"/").concat(n);return this.HttpClient.post(o,{content:JSON.stringify(i)}).then()}},{key:"callEntity",value:function(t,e,n,i){var a=this,o=t.toLowerCase(),r="".concat(p,"/entities/").concat(o,"/").concat(e,"/").concat(n);return new Promise((function(t,e){a.HttpClient.post(r,{content:JSON.stringify(i)}).then((function(n){var i=JSON.parse(n.content).correlationId;a.SignalResultPromises[i]={resolve:t,reject:e}}),e)}))}},{key:"updateEntityMetadata",value:function(t,e,n){return this.signalEntity(t,e,"$update-entity-internal-metadata",n)}},{key:"setup",value:function(t){this.Config=t,this.Config.logger||(this.Config.logger=f.d.instance)}},{key:"entityAdded",value:function(t,e,n){var i=v.FormatEntityId(t,e),a=this.EntitySets[i];a?delete this.EntitySets[i]:a=this.EntitySets[t],a&&(n.entityKey=e,a.push(n))}},{key:"entityDeleted",value:function(t,e){var n=this.EntitySets[t];if(n)for(var i=0;i<n.length;i++)if(n[i].entityKey===e){n.splice(i,1);break}}},{key:"fetchAndApplyEntityState",value:function(t,e,n,i){var a=this,o=arguments.length>4&&void 0!==arguments[4]?arguments[4]:null,r="".concat(p,"/entities/").concat(t,"/").concat(e);this.HttpClient.get(r).then((function(i){var r=JSON.parse(i.content),s=v.FormatEntityId(t,e);if(n&&r.version<n)throw new Error("Expected ".concat(s," of version ").concat(n,", but got version ").concat(r.version));o?a.applyStateChangesFrom(o,r.state):(o=r.state,Object(g.l)(o)),a.EntityStates.getState(s)||a.entityAdded(t,e,o),a.EntityStates.addOrUpdateState(s,{state:o,version:r.version})})).catch((function(r){i<a.MaxRetryCount?(i++,setTimeout((function(){a.fetchAndApplyEntityState(t,e,n,i,o)}),i*a.RetryBaseIntervalMs)):a.Config.logger.log(f.c.Error,"DurableEntitySet: failed to fetch entity state: ".concat(r))}))}},{key:"fetchAndApplyAllEntityStates",value:function(t){var e=this,n=this.EntityStates.getStatesCopy(),i="".concat(p,"/entities/").concat(t);return this.HttpClient.get(i).then((function(i){var a,o=Object(h.a)(JSON.parse(i.content));try{for(o.s();!(a=o.n()).done;){var r=a.value,s=r.entityKey,c=v.FormatEntityId(t,s),l=r,y=n[c];delete n[c],y?y.version<l.version?(e.Config.logger.log(f.c.Information,"DurableEntitySet: ".concat(c,", local version ").concat(y.version,", remote version ").concat(l.version,". State was updated.")),e.applyStateChangesFrom(y.state,l.state),y.version=l.version):e.Config.logger.log(f.c.Information,"DurableEntitySet: ".concat(c," is already known and is up to date. Skipping.")):(Object(g.l)(l.state),e.EntityStates.addOrUpdateState(c,l),e.entityAdded(t,s,l.state))}}catch(E){o.e(E)}finally{o.f()}for(var u in n){e.EntityStates.removeState(u);var d=S.GetEntityNameAndKey(u);e.entityDeleted(d.entityNameLowerCase,d.entityKey)}})).catch((function(t){e.Config.logger.log(f.c.Error,"DurableEntitySet: failed to fetch entity states: ".concat(t))}))}},{key:"fetchAndApplyKnownEntityStates",value:function(t){var e=this,n=this.EntityStates.getStoredEntityIds(t),i=this.EntityStates.getStatesCopy(),a="".concat(p,"/entities");return this.HttpClient.post(a,{content:JSON.stringify(n)}).then((function(t){for(var a=JSON.parse(t.content),o=0;o<n.length;o++){var r=n[o],s=S.GetEntityNameAndKey(r),c=a[o],l=i[r];l?l.version<c.version?(e.Config.logger.log(f.c.Information,"DurableEntitySet: ".concat(r,", local version ").concat(l.version,", remote version ").concat(c.version,". State was updated.")),e.applyStateChangesFrom(l.state,c.state),l.version=c.version):e.Config.logger.log(f.c.Information,"DurableEntitySet: ".concat(r," is already known and is up to date. Skipping.")):(Object(g.l)(c.state),e.EntityStates.addOrUpdateState(r,c),e.entityAdded(s.entityNameLowerCase,s.entityKey,c.state))}})).catch((function(n){e.Config.logger.log(f.c.Warning,"DurableEntitySet: failed to fetch known entity states: ".concat(n)),e.EntityStates.removeStoredEntityIds(t)}))}},{key:"entityStateChangedMessageHandler",value:function(t){var e=this,n=v.GetEntityId(t);this.Config.logger.log(f.c.Trace,"DurableEntitySet: ".concat(n," changed to version ").concat(t.version));var i=this.EntityStates.getState(n);if(t.isEntityDestructed)this.EntityStates.removeState(n),this.entityDeleted(t.entityName,t.entityKey);else if(i){var a=i.version+1;t.version>a?this.fetchAndApplyEntityState(t.entityName,t.entityKey,t.version,0,i.state):t.version===a&&(d.applyPatch(i.state,t.stateDiff),i.version=t.version)}else(this.EntitySets[n]||this.EntitySets[t.entityName])&&setTimeout((function(){return e.fetchAndApplyEntityState(t.entityName,t.entityKey,t.version,0)}),this.RetryBaseIntervalMs)}},{key:"entitySignalResponseHandler",value:function(t){var e=this.SignalResultPromises[t.correlationId];e&&(t.errorMessage?e.reject(new Error(t.errorMessage)):e.resolve(t.result),delete this.SignalResultPromises[t.correlationId])}},{key:"initSignalR",value:function(){var t=this;this.SignalRConn||(this.SignalRConn=(new f.b).withUrl("".concat(p),{httpClient:this.HttpClient,logger:this.Config.logger}).build(),this.SignalRConn.on("entity-state-changed",(function(e){return t.entityStateChangedMessageHandler(e)})),this.SignalRConn.on("entity-signal-response",(function(e){return t.entitySignalResponseHandler(e)})),this.SignalRConn.onclose((function(){return t.reconnectToSignalR()})),this.SignalRConn.start().then((function(){t.Config.logger.log(f.c.Information,"DurableEntitySet: successfully connected to SignalR")}),(function(e){t.Config.logger.log(f.c.Error,"DurableEntitySet: failed to connect to SignalR: ".concat(e))})))}},{key:"reconnectToSignalR",value:function(){var t=this;this.Config.logger.log(f.c.Information,"DurableEntitySet: reconnecting to SignalR..."),this.SignalRConn.start().then((function(){t.Config.logger.log(f.c.Information,"DurableEntitySet: reconnected to SignalR")}),(function(){setTimeout((function(){return t.reconnectToSignalR()}),t.SignalRReconnectIntervalInMs)}))}},{key:"applyStateChangesFrom",value:function(t,e){e.entityKey=t.entityKey;var n=d.createPatch(t,e);d.applyPatch(t,n)}}]),t}();O.Config={logger:f.d.instance},O.HttpClient=new C((function(){return O.Config})),O.EntitySets={},O.SignalResultPromises={},O.SignalRConn=void 0,O.SignalRReconnectIntervalInMs=5e3,O.MaxRetryCount=6,O.RetryBaseIntervalMs=500,O.DefaultMaxKnownEntityIdsToPersist=100,O.EntityStates=new b((function(){return void 0===O.Config.maxKnownEntityIdsToPersist?O.DefaultMaxKnownEntityIdsToPersist:O.Config.maxKnownEntityIdsToPersist}));var j=n(7);O.setup({fakeUserNamePromise:Promise.resolve("test-anonymous-user"),logger:{log:function(t,e){return console.log(e)}}});var w="CounterEntity",k="my-counter",I=O.createEntity(w,k,new function t(){Object(s.a)(this,t),this.title="",this.countContainer={count:0},this.history=[]}),N=Object(u.a)(function(t){Object(l.a)(n,t);var e=Object(y.a)(n);function n(){return Object(s.a)(this,n),e.apply(this,arguments)}return Object(c.a)(n,[{key:"render",value:function(){var t;return Object(j.jsxs)(j.Fragment,{children:[Object(j.jsxs)("div",{className:"counter-div",children:[Object(j.jsxs)("h3",{children:[" Title: '",I.title,"', count: ",null===(t=I.countContainer)||void 0===t?void 0:t.count]}),Object(j.jsx)("button",{onClick:function(){return O.signalEntity(w,k,"add",1)},children:"Increment"}),Object(j.jsx)("button",{onClick:function(){return O.signalEntity(w,k,"substract",1)},children:"Decrement"})]}),Object(j.jsx)("h4",{children:I.history.length?"History (last 10 values):":""}),Object(j.jsx)("ul",{children:I.history.map((function(t){return Object(j.jsx)("li",{children:t})}))})]})}}]),n}(a.a.Component));r.a.render(Object(j.jsx)(N,{}),document.getElementById("root"))}},[[38,1,2]]]);
//# sourceMappingURL=main.07960840.chunk.js.map