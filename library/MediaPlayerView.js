import React, {PropTypes} from 'react';

import ReactNative, {
  StyleSheet,
  View,
  NativeModules,
  requireNativeComponent,
  Image , 
  Dimensions ,
  Animated ,
  TouchableWithoutFeedback ,
  DeviceEventEmitter ,
  InteractionManager ,
  Text , 
  TouchableOpacity
} from 'react-native';

import Controls from './Controls';

const UIManager = NativeModules.UIManager;
const RCT_MEDIA_PLAYER_VIEW_REF = "RCTMediaPlayerView";
const RCTMediaPlayerView = requireNativeComponent('RCTMediaPlayerView', {
  name: 'RCTMediaPlayerView',
  propTypes: {
    ...View.propTypes,
    src: PropTypes.string,
    autoplay: PropTypes.bool,
    preload: PropTypes.string,
    loop: PropTypes.bool,
    muted: PropTypes.bool,

    onPlayerPaused: PropTypes.func,
    onPlayerPlaying: PropTypes.func,
    onPlayerFinished: PropTypes.func,
    onPlayerBuffering: PropTypes.func,
    onPlayerBufferOK: PropTypes.func,
    onPlayerProgress: PropTypes.func,
    onPlayerBufferChange: PropTypes.func 
    
  }
});
let  screenStatus = 1 ;  // 0 : 横屏， 1： 竖屏 
let showControl = true ;
export default class MediaPlayerView extends React.Component {
  
  static propTypes = {
    ...RCTMediaPlayerView.propTypes,
    controls: PropTypes.bool,
    poster: PropTypes.string , 
    screenUpdate: PropTypes.func ,
    videoTitle:PropTypes.string
  }

  static defaultProps = {
    autoplay: false,
    controls: true,
    preload: 'none',
    loop: false,
  }

  constructor(props) {
    super(props);
    this.state = {
      buffering: false,
      playing: false,
      current: 0,
      total: 0,

      width: 0,
      height: 0,
      showPoster: true ,
      controlsAnim: new Animated.Value(1) ,

    };
  }
  componentDidMount(){
    
  }
  componentWillUnmount() {
    this.stop();
    this.timer && clearTimeout(this.timer);
  }
  controlAnimation(){
    console.log("controlAnimation = " + this.props.controls ) ;
    if(this.props.controls){
      this.timer&&clearTimeout(this.timer) ;
      this.timer = setTimeout(()=>{
          this.doControlAnimation();
      } , 3000 ) ;
    }
  }
  getScreenStatus(){
    return screenStatus ;
  }
  doControlAnimation(){
    
    let toValue = 0 ;
          console.log("animated value = " + toValue ) ;
          if(!showControl)
            toValue = 1 ;
          
          Animated.timing(this.state.controlsAnim , {toValue:toValue , duration:1000}).start(()=>{
                    showControl = !showControl;
                    if(showControl){
                      this.controlAnimation();
                    }
                }) ;
  }
  render() {
    let width = this.state.width ; 
    let height = this.state.height ;
    let posterView;
    if(this.props.poster && width && height && this.state.showPoster) {
      posterView = (
        <Image
          style={{
          position: 'absolute',
          left: 0, right: 0, top: 0, bottom: 0,
          backgroundColor: 'transparent',
          width: width,
          height: height,
          resizeMode: 'contain'
          }}
          source={{uri: this.props.poster}}/>
      );
    }
    console.log("render controls = " + this.props.controls ) ;
    let controlsView;
    if (this.props.controls) {
      controlsView = (
        <Animated.View style={{
            opacity:this.state.controlsAnim,position: 'absolute', left: 0, right: 0, bottom: 0 
          }}>
          <Controls
            buffering={this.state.buffering}
            playing={this.state.playing}
            current={this.state.current}
            total={this.state.total}
            onSeekTo={this.seekTo.bind(this)}
            onPauseOrPlay={() => {
              if(!showControl){
                return ;
              }
              if(this.state.playing) {
                this.pause();
              } else {
                this.play();
              }
            }}
            screenOrientation={screenStatus}
            bufferRanges={this.state.bufferRanges}
            fullScreen={this.fullScreen.bind(this)}
        />
        </Animated.View>
      );
    }
    let fullScreenToolbar ;
    if(screenStatus == 0){
      fullScreenToolbar = (
        <Animated.View 
          style={{opacity:this.state.controlsAnim,height:40,backgroundColor:'#11111133'
                  ,justifyContent:'center',flexDirection:'row',position:'absolute'
                 ,left:0,right:0,top:0,alignItems:'center'}}>
            <TouchableOpacity 
              style={{position:'absolute' , left:10 ,top:10}}
              onPress={()=>this.fullScreen()}>
               <Text>
                 back
              </Text>
            </TouchableOpacity>
            <Text style={{color:'white'}}>
              {this.props.videoTitle}  
            </Text>
        </Animated.View>
      );
    }
    return (
      <View
        style={this.props.style}
        onLayout={this._onLayout.bind(this)}>
        
        <TouchableWithoutFeedback
          onPress={()=>{
            console.log("video click = " + showControl ) ;
            this.doControlAnimation();            
          }}>
          <RCTMediaPlayerView
            {...this.props}
            style={{flex: 1, alignSelf: 'stretch'}}
            ref={RCT_MEDIA_PLAYER_VIEW_REF}
            onPlayerPlaying={this._onPlayerPlaying.bind(this)}
            onPlayerProgress={this._onPlayerProgress.bind(this)}
            onPlayerPaused={this._onPlayerPaused.bind(this)}
            onPlayerBuffering={this._onPlayerBuffering.bind(this)}
            onPlayerBufferOK={this._onPlayerBufferOK.bind(this)}
            onPlayerFinished={this._onPlayerFinished.bind(this)}
            onPlayerBufferChange={this._onPlayerBufferChange.bind(this)}
          />
        </TouchableWithoutFeedback>
        {posterView}
        {fullScreenToolbar}
        {controlsView}
      </View>
    );
  }

  _onLayout(e) {
    let {width, height} = e.nativeEvent.layout;
    this.setState({width, height});
    this.props.onLayout && this.props.onLayout(e);
  }

  pause() {
    this.timer&&clearTimeout(this.timer);
    UIManager.dispatchViewManagerCommand(
      this._getMediaPlayerViewHandle(),
      UIManager.RCTMediaPlayerView.Commands.pause,
      null
    );
  }
  fullScreen(){
    if(!showControl)
      return ;
    
    screenStatus = ( screenStatus + 1 )% 2;
    let args = [screenStatus] ;
    
    UIManager.dispatchViewManagerCommand(
      this._getMediaPlayerViewHandle(),
      UIManager.RCTMediaPlayerView.Commands.fullScreen,
      args
    );
    this.timer = setTimeout(()=>this.props.screenUpdate&&this.props.screenUpdate() , 500 ) ;
  }
  play() {
    this.setState({showPoster: false})
    this.controlAnimation();
    
    UIManager.dispatchViewManagerCommand(
      this._getMediaPlayerViewHandle(),
      UIManager.RCTMediaPlayerView.Commands.play,
      null
    );
  }

  stop() {
    this.timer&&clearTimeout(this.timer) ;
    UIManager.dispatchViewManagerCommand(
      this._getMediaPlayerViewHandle(),
      UIManager.RCTMediaPlayerView.Commands.stop,
      null
    );
  }

  seekTo(timeMs) {
    if(!showControl&&!this.state.isplaying)
      return ;
    this.controlAnimation();
    this.setState({showPoster: false})
    let args = [timeMs];
    UIManager.dispatchViewManagerCommand(
      this._getMediaPlayerViewHandle(),
      UIManager.RCTMediaPlayerView.Commands.seekTo,
      args
    );
  }

  _getMediaPlayerViewHandle() {
    return ReactNative.findNodeHandle(this.refs[RCT_MEDIA_PLAYER_VIEW_REF]);
  }

  _onPlayerBuffering() {
    this.props.onPlayerBuffering && this.props.onPlayerBuffering();

    if (this.props.controls) {
      this.setState({
        buffering: true
      });
    }
  }

  _onPlayerBufferChange(e) {
    this.props.onPlayerBuffering && this.props.onPlayerBuffering(e);

    if (this.props.controls) {
      this.setState({
        bufferRanges: e.nativeEvent.ranges
      });
    }
  }

  _onPlayerBufferOK() {
    this.props.onPlayerBufferOK && this.props.onPlayerBufferOK();

    if (this.props.controls) {
      this.setState({
        buffering: false
      });
    }
  }


  _onPlayerPlaying() {
    this.props.onPlayerPlaying && this.props.onPlayerPlaying();

    if (this.props.controls) {
      this.setState({
        buffering: false,
        playing: true
      });
    }
  }

  _onPlayerPaused() {
    this.props.onPlayerPaused && this.props.onPlayerPaused();

    if (this.props.controls) {
      this.setState({
        playing: false
      });
    }
  }

  _onPlayerFinished() {
    this.timer&&clearTimeout(this.timer);
    Animated.timing(this.state.controlsAnim , {toValue:1 , duration:100}).start();
    showControl = true ;
    
    this.props.onPlayerFinished && this.props.onPlayerFinished();

    if (this.props.controls) {
      this.setState({
        playing: false,
        buffering: false ,
        current:0 ,
        showPoster:true
      });
    }
  }

  _onPlayerProgress(event) {
    if(!showControl)
      return ;
    let current = event.nativeEvent.current; //in ms
    let total = event.nativeEvent.total; //in ms

    this.props.onPlayerProgress && this.props.onPlayerProgress(current, total);

    if (this.props.controls) {
      this.setState({
        current: current,
        total: total
      });
    }
  }
}