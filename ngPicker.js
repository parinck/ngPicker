//////////////////////
// ngSelect Module; //
//////////////////////
angular.module( 'ngSelect', [ ] )

.controller( 'NgSelectCtrl', [
    '$scope',
    function NgSelectCtrl( $scope ) {
        var ctrl = this;

        var _optionIndex = 0,
            _config,
            _options = [ ],
            _ngModel,
            // leftover render
            _dirty = false;

        ctrl.init = function ( ngModel, config ) {
            _config = config;
            _ngModel = ngModel;
            _ngModel.$render = ctrl.render;

            if ( _dirty ) {
                // needs immediate render
                _dirty = false;
                ctrl.render( );
            }
        };

        ctrl.getConfig = function ( ) {
            return _config;
        };

        ctrl.addOption = function ( value ) {
            var optionObj = {
                index: _optionIndex++,
                value: value,
                selected: false,
                disabled: false
            };

            if ( _config.multiple ) {
                var model = ctrl.getModel( );
                if ( angular.isArray( model ) ) {
                    optionObj.selected = ( ctrl.getModel( ).indexOf( value ) >= 0 );
                }
            } else {
                optionObj.selected = ( value == ctrl.getModel( ) );
            }

            _options.push( optionObj );
            return optionObj;
        };

        ctrl.removeOption = function ( optionObj ) {
            if ( optionObj.selected ) {
                ctrl.unselect( optionObj );
            }

            var i, l, option;
            for ( i = 0, l = _options.length; i < l; i++ ) {
                option = _options[ i ];
                if ( angular.equals( optionObj, option ) ) {
                    _options.splice( i, 1 );
                    break;
                }
            }
        };

        ctrl.select = function ( optionObj ) {
            optionObj.selected = true;

            if ( !_config.multiple ) {
                angular.forEach( _options, function ( option ) {
                    if ( option.index !== optionObj.index ) {
                        option.selected = false;
                    }
                } );
            }

            _updateModel( );
        };

        ctrl.unselect = function ( optionObj ) {
            optionObj.selected = false;

            _updateModel( );
        };

        ctrl.clear = function ( ) {
            if ( _config.multiple ) {
                var model = ctrl.getModel( );
                if ( !angular.isArray( model ) ) {
                    ctrl.setModel( [ ] );
                } else {
                    model.length = 0;
                }
            } else {
                ctrl.setModel( null );
            }
        };

        ctrl.setModel = function ( val ) {
            _ngModel.$setViewValue( val );
        };

        ctrl.getModel = function ( ) {
            return _ngModel.$modelValue;
        };

        ctrl.render = function ( ) {
            if ( angular.isUndefined( _config ) ) {
                // delayed render for config init by setting dirty flag
                _dirty = true;
                return;
            }

            if ( _config.multiple ) {
                var selection = ctrl.getModel( );
                angular.forEach( _options, function ( optionsObj ) {
                    var option_selected = false;
                    for ( var i = 0; i < selection.length; i++ ) {
                        if ( selection[ i ] === optionsObj.value ) {
                            option_selected = true;
                            break;
                        }
                    }
                    optionsObj.selected = option_selected;
                } );
            } else {
                var found = false;
                angular.forEach( _options, function ( option ) {
                    // select first found option (if there's duplicate value)
                    if ( !found && option.value == ctrl.getModel( ) ) {
                        option.selected = true;
                        found = true;
                    } else {
                        option.selected = false;
                    }
                } );
            }
        };

        function _updateModel( ) {
            var selection;

            if ( _config.multiple ) {
                // update model with reference
                selection = ctrl.getModel( );
                if ( !angular.isArray( selection ) ) {
                    selection = [ ];
                } else {
                    selection.length = 0;
                }
                angular.forEach( _options, function ( option ) {
                    if ( option.selected ) {
                        selection.push( option.value );
                    }
                } );
            } else {
                selection = null;
                // update model with scalar value
                var i, l, option;
                for ( i = 0, l = _options.length; i < l; i++ ) {
                    option = _options[ i ];
                    if ( option.selected ) {
                        selection = option.value;
                        break;
                    }
                }
            }

            ctrl.setModel( selection );
        }
    }
] )

/**
 * @ngdoc directive
 * @description transform any dom elements to selectable object - container
 *
 * @param {boolean} ng-select        enable/disable selection logic for appropriate ngModel.
 * @param {expr}    select-class     general class control with vars ($optIndex, $optValue, $optSelected) (optional)
 * @param {boolean} select-multiple  enable multiple selection (optional)
 * @param {expr}    select-disabled  enable/disable selection with expression, available vars ($optIndex, $optValue, $optSelected) (optional)
 * @param {expr}    select-style     general style control with vars ($optIndex, $optValue, $optSelected) (optional)
 */
.directive( 'ngSelect', [
    function ( ) {
        return {
            restrict: 'A',
            controller: 'NgSelectCtrl',
            require: 'ngModel',
            link: {
                pre: function ( scope, iElm, iAttrs, ngModelCtrl ) {
                    var ctrl = iElm.data( '$ngSelectController' );
                    var config = {};

                    // judge multiple
                    config.multiple = ( function ( ) {
                        if ( angular.isUndefined( iAttrs.selectMultiple ) ) {
                            return false;
                        }
                        return ( iAttrs.selectMultiple === '' || Number( iAttrs.selectMultiple ) === 1 );
                    }( ) );
                    config.classExpr = iAttrs.selectClass;
                    config.disabledExpr = iAttrs.selectDisabled;
                    config.styleExpr = iAttrs.selectStyle;

                    ctrl.init( ngModelCtrl, config );
                }
            }
        };
    }
] )

/**
 * @ngdoc directive
 * @description transform any dom elements to selectable object - child
 *
 * @param {expr} ng-select-option  select option value
 * @param {expr} select-class      option specific class control with vars ($optIndex, $optValue, $optSelected) (optional)
 * @param {expr} select-disabled   option specific enable/disable selection with expression, available vars ($optIndex, $optValue, $optSelected) (optional)
 * @param {expr} select-style      option specific style control with vars ($optIndex, $optValue, $optSelected) (optional)
 */
.directive( 'ngSelectOption', [
    function ( ) {
        // Runs during compile
        return {
            restrict: 'A',
            require: '^ngSelect',
            link: function ( scope, iElm, iAttrs, ngSelectCtrl ) {
                var optionObj, disabledExpr, classExpr, styleExpr;

                // init expressions
                var ctrlConfig = ngSelectCtrl.getConfig( );
                classExpr = iAttrs.selectClass || ctrlConfig.classExpr;
                disabledExpr = iAttrs.selectDisabled || ctrlConfig.disabledExpr;
                styleExpr = iAttrs.selectStyle || ctrlConfig.styleExpr;

                optionObj = ngSelectCtrl.addOption( scope.$eval( iAttrs.ngSelectOption ) );

                // bind click event
                iElm.bind( 'click', function ( ) {
                    if ( !optionObj.disabled ) {
                        scope.$apply( function ( ) {
                            // triggering select/unselect modifies optionObj
                            ngSelectCtrl[ optionObj.selected ? 'unselect' : 'select' ]( optionObj );
                        } );
                    }
                    return false;
                } );

                // listen for directive destroy
                scope.$on( '$destroy', function ( ) {
                    if ( angular.isDefined( optionObj ) ) {
                        ngSelectCtrl.removeOption( optionObj );
                    }
                } );

                if ( angular.isDefined( disabledExpr ) ) {
                    // watch for select-disabled evaluation
                    scope.$watch( function ( scope ) {
                        return scope.$eval( disabledExpr, _getExprLocals( optionObj ) );
                    }, _updateDisabled, true );
                }

                if ( angular.isDefined( classExpr ) ) {
                    // watch for select-class evaluation
                    scope.$watch( function ( scope ) {
                        return scope.$eval( classExpr, _getExprLocals( optionObj ) );
                    }, _updateClass, true );
                }

                if ( angular.isDefined( styleExpr ) ) {
                    // watch for select-style evaluation
                    scope.$watch( function ( scope ) {
                        return scope.$eval( styleExpr, _getExprLocals( optionObj ) );
                    }, _updateStyle, true );
                }


                var exprLocalsNames = {},
                    capitalize = function ( str ) {
                        return str.charAt( 0 ).toUpperCase( ) + str.slice( 1 );
                    };

                function _getExprLocals( optionObj ) {
                    var locals = {};

                    angular.forEach( optionObj, function ( value, key ) {
                        if ( angular.isUndefined( exprLocalsNames[ key ] ) ) {
                            exprLocalsNames[ key ] = '$opt' + capitalize( key );
                        }
                        locals[ exprLocalsNames[ key ] ] = value;
                    } );
                    return locals;
                }

                function _updateDisabled( newValue ) {
                    optionObj.disabled = newValue;
                }

                function _updateStyle( newStyles, oldStyles ) {
                    if ( oldStyles && ( newStyles !== oldStyles ) ) {
                        angular.forEach( oldStyles, function ( val, propertyName ) {
                            iElm.css( propertyName, '' );
                        } );
                    }
                    if ( newStyles ) {
                        iElm.css( newStyles );
                    }
                }

                //UPDATE CLASS
                var map = function ( obj, judgeFn ) {
                    var list = [ ];
                    angular.forEach( obj, function ( v, k ) {
                        var res = judgeFn( v, k );
                        if ( res ) {
                            list.push( res );
                        }
                    } );
                    return list;
                },
                    removeClass = function ( classVal ) {
                        if ( angular.isObject( classVal ) && !angular.isArray( classVal ) ) {
                            classVal = map( classVal, function ( v, k ) {
                                if ( v ) {
                                    return k;
                                }
                            } );
                        }
                        iElm.removeClass( angular.isArray( classVal ) ? classVal.join( ' ' ) : classVal );
                    },
                    addClass = function ( classVal ) {
                        if ( angular.isObject( classVal ) && !angular.isArray( classVal ) ) {
                            classVal = map( classVal, function ( v, k ) {
                                if ( v ) {
                                    return k;
                                }
                            } );
                        }
                        if ( classVal ) {
                            iElm.addClass( angular.isArray( classVal ) ? classVal.join( ' ' ) : classVal );
                        }
                    };

                function _updateClass( newClass, oldClass ) {
                    if ( oldClass && !angular.equals( newClass, oldClass ) ) {
                        removeClass( oldClass );
                    }
                    addClass( newClass );
                }
            }
        };
    }
] );

/////////////////////
// ngPicker Module //
/////////////////////
var ngPicker = angular.module( "ngPicker", [ "ngSelect" ] );
ngPicker.service( 'utils', function ( ) {
    this.typeOfVar = function ( somevar ) {
        var type = Object.prototype.toString.call( somevar );
        switch ( type ) {
        case "[object Array]":
            return "Array";
        case "[object Object]":
            return "Object";
        case "[object Number]":
            return "Number";
        case "[object String]":
            return "String";
        }
    };

    this.search = function ( needle, haystack ) {
        if ( [ "String", "Number" ].indexOf( this.typeOfVar( needle ) ) !== -1 ) {
            return this.searchString( needle.toString( ).toLowerCase( ), haystack.toString( ).toLowerCase( ) );
        }
        return false;
    };

    this.searchString = function ( needle, haystack ) {
        if ( ( haystack ).indexOf( needle ) !== -1 ) {
            return true;
        } else {
            return false;
        };
    };

    this.searchArray = function ( ) {

    };
} );
// duplicate values;
ngPicker.filter( 'myfilter', function ( utils ) {
    return function ( values, query ) {
        if ( !query ) {
            return values;
        } else {
            var result;
            if ( "Array" === utils.typeOfVar( values ) ) {
                result = [ ];
                for ( key in values ) {
                    console.log( utils.search( query, values[ key ] ) );
                    if ( utils.search( query, values[ key ] ) ) {
                        result.push( values[ key ] );
                    }
                }
            } else if ( "Object" === utils.typeOfVar( values ) ) {
                result = {};
                for ( key in values ) {
                    if ( utils.search( query, values[ key ] ) ) {
                        result[ key ] = values[ key ];
                    }
                }
            }
            return result;
        };
    }
} );

ngPicker.directive( 'ngPicker', function ( utils ) {
    return {
        // name: '',
        // priority: 1,
        // terminal: true,
        scope: {
            src: "=",
            dst: "=",
            max: "@"
        }, // {} = isolate, true = child, false/undefined = no change
        controller: function ( $scope, $element, $attrs, $transclude ) {
            $scope.src_selection = [ ];
            $scope.dst_selection = [ ];
            $scope.dst = "Array" === utils.typeOfVar( $scope.src ) ? [ ] : {}
            $scope.max = parseInt( $scope.max );

            $scope.isDisabled = function ( selection ) {

                if ( selection === "ALL" ) {
                    var type = utils.typeOfVar( $scope.src );
                    switch ( type ) {
                    case "Array":
                        src_selection_length = $scope.src.length;
                        break;
                    case "Object":
                        src_selection_length = Object.keys( $scope.src ).length;
                        break;
                    }
                    return ( src_selection_length > $scope.max ? true : false );

                } else {
                    var count = 0;
                    var dst_lenght = 0;
                    src_selection_length = $scope.src_selection.length;
                    var type = utils.typeOfVar( $scope.dst );

                    switch ( type ) {
                    case "Array":
                        dst_lenght = $scope.dst.length;
                        break;
                    case "Object":
                        dst_lenght = Object.keys( $scope.dst ).length;
                        break;
                    }
                    count = src_selection_length + dst_lenght;
                    if ( src_selection_length == 0 ) {
                        return ( count >= $scope.max ? true : false );
                    } else {
                        return ( count > $scope.max ? true : false );
                    }
                };
            }

            $scope.selectAll = function ( ) {
                $scope.dst = angular.copy( $scope.src );
                $scope.src_selection = [ ];
            }

            $scope.deselectAll = function ( ) {
                $scope.dst = utils.typeOfVar( $scope.src ) === "Array" ? [ ] : {};
            }

            $scope.moveToDest = function ( ) {
                if ( $scope.isDisabled( ) ) {
                    return;
                }
                var index;
                for ( key in $scope.src_selection ) {
                    index = $scope.src_selection[ key ];
                    if ( "Array" === utils.typeOfVar( $scope.src ) ) {
                        if ( $scope.dst.indexOf( $scope.src[ index ] ) === -1 ) {
                            $scope.dst.push( angular.copy( $scope.src[ index ] ) );
                        }
                    } else if ( utils.typeOfVar( $scope.src ) === "Object" ) {
                        $scope.dst[ index ] = angular.copy( $scope.src[ index ] );
                    };
                }
                $scope.src_selection = [ ];
            }

            $scope.moveToSrc = function ( ) {
                if ( utils.typeOfVar( $scope.src ) === "Array" ) {
                    removeArrayKeys( );
                } else if ( utils.typeOfVar( $scope.src ) === "Object" ) {
                    removeObjectKeys( );
                }


                function removeObjectKeys( ) {
                    var index;
                    for ( key in $scope.dst_selection ) {
                        index = $scope.dst_selection[ key ];
                        delete $scope.dst[ index ];
                    }
                }

                function removeArrayKeys( ) {
                    var index;
                    for ( key in $scope.dst_selection ) {
                        index = $scope.dst_selection[ key ];
                        value = angular.copy( $scope.src[ index ] );
                        $scope.dst.splice( $scope.dst.indexOf( value ), 1 );
                    }
                }
                $scope.dst_selection = [ ]
            }
        },
        // require: 'ngSelect', // Array = multiple requires, ? = optional, ^ = check parent elements
        restrict: 'E', // E = Element, A = Attribute, C = Class, M = Comment
        // template: '',
        templateUrl: 'template.html',
        // replace: true,
        // transclude: true,
        // compile: function(tElement, tAttrs, function transclude(function(scope, cloneLinkingFn){ return function linking(scope, elm, attrs){}})),
        link: function ( $scope, iElm, iAttrs, controller ) {

        }
    };
} );
