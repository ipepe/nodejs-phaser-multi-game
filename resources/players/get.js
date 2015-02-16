hide('charaGfx');
hide('charaNoGfx');

if( this.updateTime+120*1000 < Date.now() ){
   cancel();
}
hide('updateTime');