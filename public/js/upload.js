$(document).ready(function(){
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const redirect_uri = "http://localhost:8080/profile" // replace with your redirect_uri;
    const client_secret = "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"; // replace with your client secret
    const scope = "https://www.googleapis.com/auth/drive";
    var access_token= "";
    var client_id = "322498307727-6mk5pl5kvvk9c6cdc3ic8829v2nd9nju.apps.googleusercontent.com"// replace it with your client id;
    
 
    $.ajax({
        type: 'POST',
        url: "https://www.googleapis.com/oauth2/v4/token",
        data: {code:code
            ,redirect_uri:redirect_uri,
            client_secret:client_secret,
        client_id:client_id,
        scope:scope,
        grant_type:"authorization_code"},
        dataType: "json",
        success: function(resultData) {
          console.log(resultData)
            
           localStorage.setItem("accessToken",resultData.access_token);
           localStorage.setItem("refreshToken",resultData.refreshToken);
           localStorage.setItem("expires_in",resultData.expires_in);
          
          
          
          
        }
  });
 
    function stripQueryStringAndHashFromPath(url) {
        return url.split("?")[0].split("#")[0];
    }  
 
    var Upload = function (file) {
        this.file = file;
        const title = document.querySelector("#title").value
        this.file.title = title
    };
    
    Upload.prototype.getType = function() {
        localStorage.setItem("type",this.file.type);
        return this.file.type;
    };
    Upload.prototype.getTitle = function() {
        return this.file.title;
    }
    Upload.prototype.getSize = function() {
        localStorage.setItem("size",this.file.size);
        return this.file.size;
    };
    Upload.prototype.getName = function() {
        return this.file.name;
    };
    Upload.prototype.doUpload = function () {
        var that = this;
        var formData = new FormData();
    
        // add assoc key values, this will be posts values
        formData.append("file", this.file, this.getName());
        console.log(this.file)
        formData.append("upload_file", true);

        // for (var pair of formData.entries()) {
        //     console.log(pair[0]+ ', ' + pair[1]); 
        // }

        const file = this.file;  // It supposes that "this.file" is the blob.

        const fr = new FileReader();
        fr.readAsDataURL(file);
        fr.onload = function() {

          const boundary = "xxxxxxxxxx";
          let data = "--" + boundary + "\n";
          data += "Content-Type: application/json; charset=UTF-8\n\n";
          data += JSON.stringify({name: document.querySelector("#title").value}) + "\n";
          data += "--" + boundary + "\n";
          data += "Content-Transfer-Encoding: base64\n\n";
          data += fr.result.split(",")[1] + "\n";
          data += "--" + boundary + "--";

            $.ajax({
                type: "POST",
                beforeSend: function(request) {
                    request.setRequestHeader("Authorization", "Bearer" + " " + localStorage.getItem("accessToken"));
                    request.setRequestHeader("Content-Type", "multipart/related; boundary=" + boundary)
                },
                url: "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart",
                data:data,
                xhr: function () {
                    var myXhr = $.ajaxSettings.xhr();
                    if (myXhr.upload) {
                        myXhr.upload.addEventListener('progress', that.progressHandling, false);
                    }
                    return myXhr;
                },
                success: function (data) {
                    getFilesMetadata(data.id)
                    console.log(data);
                },
                error: function (error) {
                    console.log(error);
                },
                async: true,
                cache: false,
                processData: false,
                timeout: 60000
            });
        }
    };
    
    Upload.prototype.progressHandling = function (event) {
        var percent = 0;
        var position = event.loaded || event.position;
        var total = event.total;
        var progress_bar_id = "#progress-wrp";
        if (event.lengthComputable) {
            percent = Math.ceil(position / total * 100);
        }
        // update progressbars classes so it fits your code
        $(progress_bar_id + " .progress-bar").css("width", +percent + "%");
        $(progress_bar_id + " .status").text(percent + "%");
    };
 
    $("#upload").on("click", function (e) {
        var file = $("#files")[0].files[0];
        var upload = new Upload(file);
        // maby check size or type here with upload.getSize() and upload.getType()
    
        // execute upload
        upload.doUpload();
    });

    function getFilesMetadata(fileId){
        $.ajax({
            type:'GET',
            beforeSend: function (jqXHR, settings) {
                jqXHR.setRequestHeader('Authorization', 'Bearer '+ localStorage.getItem('accessToken'));
            },
            url:`https://www.googleapis.com/drive/v2/files/${fileId}`,
            success:function(data){
                console.log("METADATA:", data);                
            },
            error: function(data) {
                console.log(data); //or whatever
            }
        })
    }
 
});
