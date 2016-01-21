module.exports = {
  name: ('azure'),
  default_config: {
    env: 'production',
    port: (process.env.port || 3000),
    db_connection_url: (process.env.CUSTOMCONNSTR_MONGODB_URI || process.env.CUSTOMCONNSTR_MONGODB_URL)
  },
  isDetected: function(){
    for(var key in process.env){
      if( key.toLowerCase().indexOf('azure') > -1){
        return true;
      }
    }
    return false;
  }
};
