var playerName = 'Player' + Math.floor(Math.random()*1000);

// do{
//     playerName = prompt("Please enter your name.", playerName );
// }while(playerName.length < 5);
var fullscreenMode = true;
// var fullscreenMode = confirm("Game should fit browser window height?");

var playerId;

dpd.players.post( { name: playerName }, function(result, error) {
    if(error){
        alert(error.message);
    }else{
        playerId = result.id;
    }
});

var game = new Phaser.Game( 320, 320, Phaser.AUTO , 'game_div', 
    { preload: preload, create: create, update: update }, false, false );

var map, groundLayer, objectLayer, cursors, player, padImg, serverTimer;
var WALK_TIMER = 400;
var INTERVAL_TIMER = 250;
var TILE_SIZE = 16;
var PLAYER_SKIN = 1;
var remotePlayers = new Object();

function preload() {
    this.add.plugin(Phaser.Plugin.Tiled);
    this.load.image('pad', 'gfx/pad.png');
    // this.load.image('map01', 'gfx/map01.gif'); // loading the tileset image
    // this.load.tilemap('map', 'gfx/map01.json', null, Phaser.Tilemap.TILED_JSON); // loading the tilemap file
    this.load.spritesheet('chara6', 'gfx/chara6.gif', 32, 32);
    this.load.spritesheet('chara0', 'gfx/chara0.gif', 32, 32);
    cursors = this.input.keyboard.createCursorKeys();
    game.stage.smoothed = false;

    cacheKey = Phaser.Plugin.Tiled.utils.cacheKey;
    game.load.tiledmap( cacheKey('my-mapKey', 'tiledmap'), 'gfx/map01.json', null, Phaser.Tilemap.TILED_JSON);
    game.load.image(    cacheKey('my-mapKey', 'tileset', 'map01'), 'gfx/map01.gif');

}
function create() {
    map = this.add.tiledmap('my-mapKey'); // Preloaded tilemap
    // map.addTilesetImage('map01'); // Preloaded tileset

    // groundLayer = map.createLayer('groundLayer');
    // sceneLayer = map.createLayer('sceneLayer');
    // groundLayer.resizeWorld(); 
    //createPlayerGfx(playerObj, playerNameObj, gfxNumber, gfxMaxNumber, gfxName, xCord, yCord)
    player = createPlayerGfx(player, playerName, 1, 2, 'chara6', 96, 96);

    game.camera.follow(player);

    padImg = game.add.sprite(220, 220, 'pad');
    padImg.fixedToCamera = true;
    //padImg.inputEnabled = true;

    serverTimer = setInterval(updatePlayers, INTERVAL_TIMER);

    if(fullscreenMode){
        this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.scale.minWidth = SAFE_ZONE_WIDTH;
        this.scale.minHeight = SAFE_ZONE_HEIGHT;
        this.scale.maxWidth = 1536;
        this.scale.maxHeight = 2048;
        this.scale.pageAlignHorizontally = true;
        this.scale.pageAlignVertically = true;
        this.scale.setScreenSize(true);
    }
}
function update(){
    inputControls();
}
/*
* Helper functions
*/
function createPlayerGfx(playerObj, playerNameObj, gfxNumber, gfxMaxNumber, gfxName, xCord, yCord){
    playerObj = game.add.sprite(24, 16, gfxName);
    var a = gfxNumber;
    var b = gfxMaxNumber;
    playerObj.animations.add('walk_down', [ 0+(a*3), 1+(a*3), 2+(a*3) ], 12, true, true);
    playerObj.animations.add('idle_down', [ 1+(a*3) ], 1, false, true);

    playerObj.animations.add('walk_left', [ 3*b+(a*3), 1+ 3*b+(a*3), 2+3*b+(a*3) ], 12, true, true);
    playerObj.animations.add('idle_left', [ 1+ 3*b+(a*3) ], 1, false, true);

    playerObj.animations.add('walk_right', [ 6*b+(a*3), 6*b+(a*3)+1, 6*b+(a*3)+2], 12, true, true);
    playerObj.animations.add('idle_right', [ 6*b+(a*3)+1 ], 1, false, true);

    playerObj.animations.add('walk_up', [ 9*b+(a*3), 9*b+(a*3)+1, 9*b+(a*3)+2 ], 12, true, true);
    playerObj.animations.add('idle_up', [ 9*b+(a*3)+1 ], 1, false, true);

    playerObj.animations.play('idle_down');
    game.physics.arcade.enable(playerObj);
    playerObj.body.collideWorldBounds = true;
    playerObj.body.setSize(16,16,8,16);
    playerObj.body.maxVelocity = new Phaser.Point(0, 0);
    playerObj.isMoving = false;
    var playerText = game.add.text(TILE_SIZE, 0, playerNameObj, 
        {font:"bold 10px sans-serif",fill:"#f1c40f", stroke: "black", strokeThickness: 4} );
    playerText.anchor.setTo(0.5,0.5);
    playerObj.addChild( playerText );

    playerObj.x = xCord-8;
    playerObj.y = yCord-16;
    return playerObj;
}
//
function inputControls(){
    if(!player.isMoving){
        if(game.input.activePointer.isDown){

            var clickX = game.input.activePointer.x - 270;
            var clickY = game.input.activePointer.y - 270 ;
            // debugText2.text=('TouchX: ' + clickX + ' TouchY: ' + clickY);
            // debugText2.text=('active.y:' + game.input.activePointer.y + ' game.scale.height:' + game.scale.height);
            if (clickX < 50 && clickY > -50){
                if(clickX > clickY){
                    if(-clickX > clickY){
                        movePlayer(0, -TILE_SIZE, 'up');
                    }else{
                        movePlayer(TILE_SIZE, 0, 'right');
                    }

                }else{
                    if(-clickX > clickY){
                        movePlayer(-TILE_SIZE, 0, 'left');
                    }else{
                        movePlayer(0, TILE_SIZE, 'down');
                    }
                }
            }
        }
        if ( cursors.left.isDown ) {
            movePlayer(-TILE_SIZE, 0, 'left');
        }else if ( cursors.right.isDown ){
            movePlayer(TILE_SIZE, 0, 'right');
        }else if ( cursors.up.isDown){
            movePlayer(0, -TILE_SIZE, 'up');
        }else if ( cursors.down.isDown ){
            movePlayer(0, TILE_SIZE, 'down');
        }
    }
}
function informServer(newX, newY, newDirection) {
    if(newX == -1 && newY == -1){
        dpd.players.put(playerId, { direction: newDirection }, function(result, error) {
            if(error){
                alert(error.message);
            }
        });
    }else{
        dpd.players.put(playerId, { direction: newDirection, xCord: newX, yCord: newY }, function(result, error) {
            if(error){
                alert(error.message);
            }
        });
    }
}
function updatePlayers(){
// dpd.players.get( { "updateTime" : {"$gt": Date.now()-60*1000 } },function(result, error){
    dpd.players.get(function(result, error){
        if(error){
            console.log(error);
        }else{
            result.forEach(function(each){
                if(each.id !== playerId){
                    if( remotePlayers[each.id] ){
                        if( !remotePlayers[each.id].alive ){
                            remotePlayers[each.id].revive();
                        }
                        if( (remotePlayers[each.id].x+8) !== each.xCord || (remotePlayers[each.id].y+16) !== each.yCord ){
                            remotePlayers[each.id].animations.play('walk_' + each.direction);

                            game.add.tween(remotePlayers[each.id]).to(
                                {x: each.xCord-8, y: each.yCord-16},
                                INTERVAL_TIMER, 
                                Phaser.Easing.Quadratic.InOut, 
                                true).onComplete.add(
                                function() {
                                    remotePlayers[each.id].animations.play('idle_' + each.direction);
                                }, game);
                            }else{
                                remotePlayers[each.id].animations.play('idle_' + each.direction);
                            }
                        }else{
                            remotePlayers[each.id] = createPlayerGfx(remotePlayers[each.id], each.name, 2, 3, 'chara0', each.xCord, each.yCord);
                        }
                        remotePlayers[each.id].conStatus = false;
                    }
                });
            //
            for (var key in remotePlayers) {
                if ( remotePlayers.hasOwnProperty(key) ) {
                    if(remotePlayers[key].conStatus == true){
                        remotePlayers[key].kill();
                    }
                    remotePlayers[key].conStatus = true;
                }
            }
        }
    });
}
function movePlayer(newX, newY, direction) {
    if (player.isMoving) return;

    game.world.bringToTop(padImg);
    // game.world.bringToTop(player);
    if( isTileWalkable(player.body.position.x + newX, player.body.position.y + newY) ){
        informServer(player.body.position.x + newX, player.body.position.y + newY, direction);
        player.isMoving = true;
        player.animations.play('walk_' + direction);

        game.add.tween(player).to(
            {x: player.x + newX, y: player.y + newY},
            WALK_TIMER, 
            Phaser.Easing.Quadratic.InOut, 
            true).onComplete.add(
            function() {
                player.isMoving = false;
                player.animations.play('idle_' + direction);
            }, this);
        //
    }else{
        informServer(-1,-1,direction);
        player.animations.play('idle_' + direction);
    }
}
function isTileWalkable(cordX, cordY){
    var tileX = cordX / 16;
    var tileY = cordY / 16;
    var groundTile = map.getTile( tileX , tileY , map.layers[0] );
    var sceneTile  = map.getTile( tileX , tileY , map.layers[1] );
    //.properties.walkable == 'true'
    //var y = (x == 2 ? "yes" : "no");
    //console.log( (typeof groundTile.properties.walkable) + ' ' + (typeof sceneTile.properties.walkable) );
    if(groundTile){
        if(!sceneTile){
            return (groundTile.properties.walkable == true);
        }else{
            return (groundTile.properties.walkable == true) && (sceneTile.properties.walkable == true);
        }
    }else{
        return false;
    }
}
window.onbeforeunload = closingCode;
window.onunload = closingCode;
function closingCode(){
    dpd.players.del(playerId);
}
