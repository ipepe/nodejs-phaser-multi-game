module.exports = {
  name: ('heroku'),
  default_config: {
    env: 'production',
    port: process.env.port,
    db_connection_url: process.env.MONGOHQ_URL || process.env.MONGOLAB_URI
  },
  isDetected: function(){
    for(var key in process.env){
      if( key.toLowerCase().indexOf('heroku') > -1){
        return true;
      }
    }
    return false;
  }
};
