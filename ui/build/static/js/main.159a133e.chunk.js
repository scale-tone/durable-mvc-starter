(this["webpackJsonpdurable-mvc-starter-ui"]=this["webpackJsonpdurable-mvc-starter-ui"]||[]).push([[0],{32:function(t,e,n){},38:function(t,e,n){"use strict";n.r(e);var i=n(1),a=n.n(i),o=n(13),r=n.n(o),s=(n(32),n(8)),c=n(11),l=n(15),u=n(14),y=n(26),h=n(27),g=n(2),f=n(5),d=n(16),v=function(){function t(){Object(s.a)(this,t),this.entityName="",this.entityKey="",this.version=0,this.stateDiff=[],this.isEntityDestructed=!1}return Object(c.a)(t,null,[{key:"GetEntityId",value:function(e){return t.FormatEntityId(e.entityName,e.entityKey)}},{key:"FormatEntityId",value:function(t,e){return"@".concat(t,"@").concat(e)}}]),t}(),E=n(17),S=n(9),p="/a/p/i",m=function(t){Object(l.a)(n,t);var e=Object(u.a)(n);function n(t){var i;return Object(s.a)(this,n),(i=e.call(this,f.d.instance))._configFabric=t,i}return Object(c.a)(n,[{key:"send",value:function(t){var e=this;if(t.url.includes(p)){var i=this._configFabric();if(i.accessTokenFactory)return i.accessTokenFactory().then((function(i){return t.headers={},t.headers.Authorization="Bearer "+i,Object(E.a)(Object(S.a)(n.prototype),"send",e).call(e,t)}));if(i.fakeUserNamePromise)return i.fakeUserNamePromise.then((function(i){return i&&(t.headers={},t.headers["x-ms-client-principal-name"]=i),Object(E.a)(Object(S.a)(n.prototype),"send",e).call(e,t)}))}return Object(E.a)(Object(S.a)(n.prototype),"send",this).call(this,t)}}]),n}(f.a),C=function(){function t(e){var n=!(arguments.length>1&&void 0!==arguments[1])||arguments[1];Object(s.a)(this,t),this._entityNameLowerCase=e,this.items=[],this._entityNameLowerCase=this._entityNameLowerCase.toLowerCase(),Object(g.m)(this,{items:g.n}),n&&this.attachAllEntities()}return Object(c.a)(t,[{key:"attachAllEntities",value:function(){return t.initSignalR(),t.EntitySets[this._entityNameLowerCase]=this.items,t.fetchAndApplyAllEntityStates(this._entityNameLowerCase)}},{key:"attachEntity",value:function(e){var n=v.FormatEntityId(this._entityNameLowerCase,e);t.getEntityState(n)||(t.EntitySets[n]=this.items,t.attachEntity(this._entityNameLowerCase,e,void 0))}},{key:"createEntity",value:function(e){t.createEntity(this._entityNameLowerCase,e,void 0)}},{key:"signalEntity",value:function(e,n,i){return t.signalEntity(this._entityNameLowerCase,e,n,i)}},{key:"callEntity",value:function(e,n,i){return t.callEntity(this._entityNameLowerCase,e,n,i)}},{key:"updateEntityMetadata",value:function(e,n){return t.updateEntityMetadata(this._entityNameLowerCase,e,n)}}],[{key:"attachEntity",value:function(e,n,i){t.initSignalR();var a=e.toLowerCase(),o=this.getEntityState(v.FormatEntityId(a,n));return o?o.state:(i&&Object(g.l)(i),this.fetchAndApplyEntityState(a,n,0,0,i),i)}},{key:"createEntity",value:function(t,e,n){return this.updateEntityMetadata(t,e,{}),this.attachEntity(t,e,n)}},{key:"signalEntity",value:function(t,e,n,i){var a=t.toLowerCase(),o="".concat(p,"/entities/").concat(a,"/").concat(e,"/").concat(n);return this.HttpClient.post(o,{content:JSON.stringify(i)}).then()}},{key:"callEntity",value:function(t,e,n,i){var a=this,o=t.toLowerCase(),r="".concat(p,"/entities/").concat(o,"/").concat(e,"/").concat(n);return new Promise((function(t,e){a.HttpClient.post(r,{content:JSON.stringify(i)}).then((function(n){var i=JSON.parse(n.content).correlationId;a.SignalResultPromises[i]={resolve:t,reject:e}}),e)}))}},{key:"updateEntityMetadata",value:function(t,e,n){return this.signalEntity(t,e,"$update-entity-internal-metadata",n)}},{key:"setup",value:function(t){this.Config=t,this.Config.logger||(this.Config.logger=f.d.instance)}},{key:"getEntityState",value:function(t){return this.EntityStates[t]}},{key:"addOrUpdateEntityState",value:function(t,e){this.EntityStates[t]=e}},{key:"removeEntityState",value:function(t){delete this.EntityStates[t]}},{key:"entityAdded",value:function(t,e,n){var i=v.FormatEntityId(t,e),a=this.EntitySets[i];a?delete this.EntitySets[i]:a=this.EntitySets[t],a&&(n.entityKey=e,a.push(n))}},{key:"entityDeleted",value:function(t,e){var n=this.EntitySets[t];if(n)for(var i=0;i<n.length;i++)if(n[i].entityKey===e){n.splice(i,1);break}}},{key:"fetchAndApplyEntityState",value:function(t,e,n,i){var a=this,o=arguments.length>4&&void 0!==arguments[4]?arguments[4]:null,r="".concat(p,"/entities/").concat(t,"/").concat(e);this.HttpClient.get(r).then((function(i){var r=JSON.parse(i.content),s=v.FormatEntityId(t,e);if(n&&r.version<n)throw new Error("Expected ".concat(s," of version ").concat(n,", but got version ").concat(r.version));o?a.applyStateChangesFrom(o,r.state):(o=r.state,Object(g.l)(o)),a.getEntityState(s)||a.entityAdded(t,e,o),a.addOrUpdateEntityState(s,{state:o,version:r.version})})).catch((function(r){i<a.MaxRetryCount?(i++,setTimeout((function(){a.fetchAndApplyEntityState(t,e,n,i,o)}),i*a.RetryBaseIntervalMs)):a.Config.logger.log(f.c.Error,"DurableEntitySet: failed to fetch entity state: ".concat(r))}))}},{key:"fetchAndApplyAllEntityStates",value:function(t){var e=this,n="".concat(p,"/entities/").concat(t);return this.HttpClient.get(n).then((function(n){var i,a=Object(h.a)(JSON.parse(n.content));try{for(a.s();!(i=a.n()).done;){var o=i.value,r=o.entityKey,s=v.FormatEntityId(t,r),c=o,l=e.getEntityState(s);l?l.version<c.version?(e.Config.logger.log(f.c.Information,"DurableEntitySet: ".concat(s,", local version ").concat(l.version,", remote version ").concat(c.version,". State was updated.")),e.applyStateChangesFrom(l.state,c.state),l.version=c.version):e.Config.logger.log(f.c.Information,"DurableEntitySet: ".concat(s," is already known and is up to date. Skipping.")):(Object(g.l)(c.state),e.addOrUpdateEntityState(s,c),e.entityAdded(t,r,c.state))}}catch(u){a.e(u)}finally{a.f()}})).catch((function(t){e.Config.logger.log(f.c.Error,"DurableEntitySet: failed to fetch entity states: ".concat(t))}))}},{key:"entityStateChangedMessageHandler",value:function(t){var e=this,n=v.GetEntityId(t);this.Config.logger.log(f.c.Trace,"DurableEntitySet: ".concat(n," changed to version ").concat(t.version));var i=this.getEntityState(n);if(t.isEntityDestructed)this.removeEntityState(n),this.entityDeleted(t.entityName,t.entityKey);else if(i){var a=i.version+1;t.version>a?this.fetchAndApplyEntityState(t.entityName,t.entityKey,t.version,0,i.state):t.version===a&&(d.applyPatch(i.state,t.stateDiff),i.version=t.version)}else(this.EntitySets[n]||this.EntitySets[t.entityName])&&setTimeout((function(){return e.fetchAndApplyEntityState(t.entityName,t.entityKey,t.version,0)}),this.RetryBaseIntervalMs)}},{key:"entitySignalResponseHandler",value:function(t){var e=this.SignalResultPromises[t.correlationId];e&&(t.errorMessage?e.reject(new Error(t.errorMessage)):e.resolve(t.result),delete this.SignalResultPromises[t.correlationId])}},{key:"initSignalR",value:function(){var t=this;this.SignalRConn||(this.SignalRConn=(new f.b).withUrl("".concat(p),{httpClient:this.HttpClient,logger:this.Config.logger}).build(),this.SignalRConn.on("entity-state-changed",(function(e){return t.entityStateChangedMessageHandler(e)})),this.SignalRConn.on("entity-signal-response",(function(e){return t.entitySignalResponseHandler(e)})),this.SignalRConn.onclose((function(){return t.reconnectToSignalR()})),this.SignalRConn.start().then((function(){t.Config.logger.log(f.c.Information,"DurableEntitySet: successfully connected to SignalR")}),(function(e){t.Config.logger.log(f.c.Error,"DurableEntitySet: failed to connect to SignalR: ".concat(e))})))}},{key:"reconnectToSignalR",value:function(){var t=this;this.Config.logger.log(f.c.Information,"DurableEntitySet: reconnecting to SignalR..."),this.SignalRConn.start().then((function(){t.Config.logger.log(f.c.Information,"DurableEntitySet: reconnected to SignalR")}),(function(){setTimeout((function(){return t.reconnectToSignalR()}),t.SignalRReconnectIntervalInMs)}))}},{key:"applyStateChangesFrom",value:function(t,e){e.entityKey=t.entityKey;var n=d.createPatch(t,e);d.applyPatch(t,n)}}]),t}();C.Config={logger:f.d.instance},C.HttpClient=new m((function(){return C.Config})),C.EntitySets={},C.SignalResultPromises={},C.SignalRConn=void 0,C.SignalRReconnectIntervalInMs=5e3,C.MaxRetryCount=6,C.RetryBaseIntervalMs=500,C.EntityStates={};var b=n(6);C.setup({fakeUserNamePromise:Promise.resolve("test-anonymous-user"),logger:{log:function(t,e){return console.log(e)}}});var j="CounterEntity",O="my-counter",k=C.createEntity(j,O,new function t(){Object(s.a)(this,t),this.title="",this.countContainer={count:0},this.history=[]}),R=Object(y.a)(function(t){Object(l.a)(n,t);var e=Object(u.a)(n);function n(){return Object(s.a)(this,n),e.apply(this,arguments)}return Object(c.a)(n,[{key:"render",value:function(){var t;return Object(b.jsxs)(b.Fragment,{children:[Object(b.jsxs)("div",{className:"counter-div",children:[Object(b.jsxs)("h3",{children:[" Title: '",k.title,"', count: ",null===(t=k.countContainer)||void 0===t?void 0:t.count]}),Object(b.jsx)("button",{onClick:function(){return C.signalEntity(j,O,"add",1)},children:"Increment"}),Object(b.jsx)("button",{onClick:function(){return C.signalEntity(j,O,"substract",1)},children:"Decrement"})]}),Object(b.jsx)("h4",{children:k.history.length?"History (last 10 values):":""}),Object(b.jsx)("ul",{children:k.history.map((function(t){return Object(b.jsx)("li",{children:t})}))})]})}}]),n}(a.a.Component));r.a.render(Object(b.jsx)(R,{}),document.getElementById("root"))}},[[38,1,2]]]);
//# sourceMappingURL=main.159a133e.chunk.js.map