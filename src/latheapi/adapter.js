// The adapter is the interface between vertices and lathe objects
define([
    'casgraph/sha1hasher',
    'geomnode',
    'geometrygraphsingleton',
    'latheapi/normalize',
    'latheapi/pool',
    'latheapi/bspdb',
  ], function(SHA1Hasher, GeomNode, geometryGraph, Normalize, Lathe, BSPDB) {

  var infoHandler = function(a,b,c,d) {
    console.info.apply(console, arguments);
  }
  var errorHandler = function(a,b,c,d) {
    console.error.apply(console, arguments);
  }
  var bspdb = new BSPDB(infoHandler, errorHandler); 

  var getOrGenerate = function(sha, generator, callback) {
    // Read from the DB, or generate it if it doesn't exist
    bspdb.read(sha, function(err, jobResult) {
      if (err) {
        console.error('error reading from BSP DB', err);
      }
      if (jobResult) {
        callback(undefined, jobResult);
      } else {
        var jobId = generator();
        Lathe.broker.on(jobId, function(jobResult) {

          bspdb.write({
            sha: sha,
            polygons: jobResult.polygons,
            serializedBSP: jobResult.serializedBSP,
          }, function(err) {
            if (err) {
              postMessage({error: 'error writing to BSP DB' + err});
            }
          });

          jobResult.sha = sha;
          jobResult.id = jobId;
          callback(undefined, jobResult);
        });
      }
    });
  }

  var generateBoolean = function(vertex, latheGenerator, callback) {

    var children = geometryGraph.childrenOf(vertex);
    var childResults = {};
    var allChildrenExist;

    // Ensure all children exist 
    var remaining = children.length;
    children.forEach(function(child) {
      generate(child, function(err, result) {
        if (err) {
          callback(err)
        } else {
          --remaining;
          childResults[child.id] = result;
          if (remaining === 0) {
            allChildrenExist();
          }
        }
      })
    })

    allChildrenExist = function() {
      var uniqueObj = GeomNode.strip(vertex);
      var childSHAs = children.map(function(child) {
        return childResults[child.id].sha;
      })
      uniqueObj.childSHAs = childSHAs;
      var sha = SHA1Hasher.hash(uniqueObj);

      var childBSPs = children.map(function(child) {
        return childResults[child.id].serializedBSP;
      })

      if (addCallbackAndShouldGenerate(sha, callback)) {
        getOrGenerate(sha, function() {
          var normalized = Normalize.normalizeVertex(vertex);
          return latheGenerator(sha, childBSPs, normalized.transforms, normalized.workplane);
        }, performCallback);
      }
    }
    
  }

  // Share the generate callbacks so only a single generate is performed
  // for multiple renders for example

  var generateCallbacks = {};

  var addCallbackAndShouldGenerate = function(sha, callback) {
    if (!generateCallbacks[sha]) {
      generateCallbacks[sha] = [];
    }
    generateCallbacks[sha].push(callback);
    return generateCallbacks[sha].length === 1;
  }

  var performCallback = function(err, result) {
    generateCallbacks[result.sha].forEach(function(callback) {
      callback(err, result);
    });
    generateCallbacks[result.sha] = undefined;
  }

  var generate = function(vertex, callback) {
    switch (vertex.type) {
      case 'sphere':
        var normalized = Normalize.normalizeVertex(vertex);
        var sha = SHA1Hasher.hash(normalized);
        if (addCallbackAndShouldGenerate(sha, callback)) {
          getOrGenerate(sha, function() {
            return Lathe.createSphere(sha, normalized, normalized.transforms, normalized.workplane);
          }, performCallback);
        }
        break;
      case 'cylinder':
        var normalized = Normalize.normalizeVertex(vertex);
        var sha = SHA1Hasher.hash(normalized);
        if (addCallbackAndShouldGenerate(sha, callback)) {
          getOrGenerate(sha, function() {
            return Lathe.createCylinder(sha, normalized, normalized.transforms, normalized.workplane);
          }, performCallback);
        }
        break;
      case 'cone':
        var normalized = Normalize.normalizeVertex(vertex);
        var sha = SHA1Hasher.hash(normalized);
        if (addCallbackAndShouldGenerate(sha, callback)) {
          getOrGenerate(sha, function() {
            return Lathe.createCone(sha, normalized, normalized.transforms, normalized.workplane);
          }, performCallback);
        }
        break;
      case 'cube':
        var normalized = Normalize.normalizeVertex(vertex);
        var sha = SHA1Hasher.hash(normalized);
        if (addCallbackAndShouldGenerate(sha, callback)) {
          getOrGenerate(sha, function() {
            return Lathe.createCube(sha, normalized, normalized.transforms, normalized.workplane);
          }, performCallback);
        }
        break;
      case 'union':
        generateBoolean(vertex, Lathe.createUnion, callback);
        break;
      case 'subtract':
        generateBoolean(vertex, Lathe.createSubtract, callback);
        break;
      case 'intersect':
        generateBoolean(vertex, Lathe.createIntersect, callback);
        break;
      default:
        throw Error('unknown vertex id/type: ' + vertex.id + '/' + vertex.type);
    }
  }

  var broker = new function() {
      _.extend(this, Events);
    }
    this.broker = broker;

  var uiDBInitialized = false, poolInitialized = false;
  bspdb.on('initialized', function() {
    uiDBInitialized = true;
    if (uiDBInitialized && poolInitialized) {
      broker.trigger('initialized');
    }
  });
  Lathe.broker.on('initialized', function() {
    poolInitialized = true;
    if (uiDBInitialized && poolInitialized) {
      broker.trigger('initialized');
    }
  });

  return {
    generate: generate,
    broker  :  broker,
  }

});