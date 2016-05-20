$(document).ready(function() {
    
    $.support.cors = true;
    $("#travelDate").datepicker();
    
    $("#submitBtn").button().click(function() {
        
        var data = {
            userName : 'admin',
            password : 'secret',
            'request.teacherName' : $("#teacherName").val(),
            'request.schoolName' : $("#schoolName").val(),
            'request.createdBy' : this.userName,
        };

        $.ajax('http://localhost:9000/fieldTrip/newRequest', {
            type: 'POST',
            
            data: data,
                
            success: function(data) {
                if((typeof data) == "string") data = jQuery.parseJSON(data);
            },
            
            error: function(data) {
            }
        });
                
    });

});
