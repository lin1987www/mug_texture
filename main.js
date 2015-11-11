// shim layer with setTimeout fallback

document.addEventListener("DOMContentLoaded", init, false);

var scene = null;
var textureCanvas = null;
var dynamicTexture = null;
var mesh = null;
var imageUrlText = null;
var lastImageUrl = null;

function init() {
    // Get the canvas element from our HTML below
    var canvas = document.querySelector("#frontBuffer");

    // Load the BABYLON 3D engine
    var engine = new BABYLON.Engine(canvas, true);
    // -------------------------------------------------------------
    textureCanvas = document.querySelector("#texture");
    imageUrlText = document.querySelector("#imgUrlText");

    var queryImageUrl = getParameterByName("image");
    if (queryImageUrl) {
        imageUrlText.value = queryImageUrl;
    }

    var createScene = function () {
        var scene = new BABYLON.Scene(engine);
        // Change the scene background color to green.
        scene.clearColor = new BABYLON.Color3(0.71, 0.71, 0.71);
        //Adding a light

        var light0 = new BABYLON.PointLight("point0", new BABYLON.Vector3(0, 10, -30), scene);
        var light1 = new BABYLON.PointLight("point1", new BABYLON.Vector3(0, 10, 30), scene);
        var light2 = new BABYLON.PointLight("point2", new BABYLON.Vector3(30, 10, 0), scene);
        var light3 = new BABYLON.PointLight("point3", new BABYLON.Vector3(-30, 10, 0), scene);


        //Adding an Arc Rotate Camera
        var camera = new BABYLON.ArcRotateCamera("Camera", 0, 0, 20, BABYLON.Vector3.Zero(), scene);
        // Quick, let's use the setPosition() method... with a common Vector3 position, to make our camera better aimed.
        camera.setPosition(new BABYLON.Vector3(10, 10, -30));
        camera.attachControl(canvas, false);

        dynamicTexture = new BABYLON.DynamicTexture("dyntex", textureCanvas, scene, true);

        // The first parameter can be used to specify which mesh to import. Here we import all meshes
        BABYLON.SceneLoader.ImportMesh("", "", "mug.babylon", scene, function (newMeshes) {
            mesh = newMeshes[0];
            // Set the target of the camera to the first imported mesh
            camera.target = mesh;
            loadImageForTexture();
        });

        return scene;
    };

    scene = createScene();
    // Register a render loop to repeatedly render the scene
    engine.runRenderLoop(function () {
        scene.render();
    });
    // Watch for browser/canvas resize events
    window.addEventListener("resize", function () {
        engine.resize();
    });
}

function getParameterByName(name) {
    name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
    var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
    return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
}

function loadImageForTexture() {
    if (lastImageUrl != imageUrlText.value) {
        loadImage(textureCanvas, imageUrlText.value, function (imageData) {
            lastImageUrl = imageUrlText.value;
            update();
        });
    }
}

function update() {
    // Write Text
    //dynamicTexture.drawText("Eternalcoding", null, 480, "bold 70px Segoe UI", "black", null);
    dynamicTexture.update(true);

    var oldMaterial = mesh.material;
    var dynamicMaterial = new BABYLON.StandardMaterial('mat', scene);
    dynamicMaterial.diffuseTexture = dynamicTexture;

    dynamicMaterial.ambientColor = oldMaterial.ambientColor
    dynamicMaterial.diffuseColor = oldMaterial.diffuseColor
    dynamicMaterial.emissiveColor = oldMaterial.emissiveColor
    dynamicMaterial.specularColor = oldMaterial.specularColor;
    dynamicMaterial.specularPower = oldMaterial.specularPower;

    //oldMaterial.dispose();
    mesh.material = dynamicMaterial;
}

function loadImage(canvas, imgUrl, callback) {
    var canvasContext = canvas.getContext("2d");
    canvasContext.fillStyle = "#FFFFFF";
    canvasContext.fillRect(0, 0, canvas.width, canvas.height);

    var img = new Image();
    img.onload = function () {
        // 位移高度，配合texture的範圍
        var offset = Math.round(canvas.height * 0.6);
        var offsetHeight = canvas.height - offset;

        var fillResizeResult = fillResize(img.width, img.height, canvas.width, offsetHeight);

        canvasContext.drawImage(img, 0, 0, img.width, img.height, fillResizeResult.destX, fillResizeResult.destY + offset, fillResizeResult.destWidth, fillResizeResult.destHeight);
        img.onload = null;
        img.src = "";
        delete img;
        var imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
        if (callback != null) {
            callback.apply(this, [imageData]);
        }
    };
    img.src = imgUrl;
};

var FillResizeResult = (function () {
    function FillResizeResult(imgWidth, imgHeight, containerWidth, containerHeight) {
        this.imgWidth = imgWidth;
        this.imgHeight = imgHeight;
        this.containerWidth = containerWidth;
        this.containerHeight = containerHeight;
        this.scale = 1;
        this.destX = 0;
        this.destY = 0;
        this.destWidth = imgWidth;
        this.destHeight = imgHeight;
    }
    FillResizeResult.prototype.toString = function () {
        return "{imgWidth: " + this.imgWidth + " imgHeight:" + this.imgHeight +
        "\n containerWidth:" + this.containerWidth + " containerHeight:" + this.containerHeight +
        "\n scale:" + this.scale +
        "\n destWidth:" + this.destWidth + " destHeight:" + this.destHeight +
        "\n destX:" + this.destX + " destY:" + this.destY +
        "\n }";
    };
    return FillResizeResult;
})();

function fillResize(imgWidth, imgHeight, containerWidth, containerHeight) {
    var result = new FillResizeResult(imgWidth, imgHeight, containerWidth, containerHeight);
    var scaleWidth = containerWidth / imgWidth;
    var scaleHeight = containerHeight / imgHeight;
    result.scale = Math.min(scaleWidth, scaleHeight);
    result.destWidth = Math.round(result.scale * imgWidth);
    result.destHeight = Math.round(result.scale * imgHeight);
    result.destX = Math.round((containerWidth - result.destWidth) / 2);
    result.destY = Math.round((containerHeight - result.destHeight) / 2);
    //console.log(result.toString());
    return result;
}