const unirest = require('unirest');

module.exports = function (context, req) {

    Date.prototype.addDays = function(days) {
        var dat = new Date(this.valueOf());
        dat.setDate(dat.getDate() + days);
        return dat;
    }

    if (req.query.r === "rg") {
        //context.log(req.body);

        try{
            const payload = req.body.payload;
            const content = buildContent(payload);
            const resourceEmail = determineRecipient(payload.resource.email);
            context.log(resourceEmail);

            const pushBody = { 
                app_id: process.env.ONESIGNAL_APPID,
                contents: {"en": content.pushMessage },
                headings: {"en": "Resource Guru"},
                subtitle: {"en": content.projectName},
                filters: [
	  	            {"field": "email", "relation": "=", "value": resourceEmail}
	            ],
                url: "https://ogilvydigital.resourceguruapp.com"
            }; 
            
            const pushHeaders = {'Accept': 'application/json', 'Content-Type': 'application/json; charset=utf-8', 'Authorization': `Basic ${process.env.ONESIGNAL_RESTAPI_KEY}`};

            unirest.post('https://onesignal.com/api/v1/notifications')
                .headers(pushHeaders)
                .send(pushBody)
                .end(function (response) {
                   //context.log("OneSignal: " + JSON.stringify(response.body));
                });

        }
        catch(err)
        {
            context.log("Err: " + err);
            context.res = {
                    status: 400,
                    body: "Bad Request :p" + err
                };
        }
        
    }
    else {
        context.log("===Forbidden access===");
        context.log(req.query);
        context.log(req.body);
        context.log("===End of access===")
        context.res = {
            status: 403,
            body: "Forbidden Access!"
        };
    }

    context.done();
};

function buildContent(payload){

    let action = "booked";
    let project = (payload.project || payload.client || { name: "unknown"}).name.replace('.', '');
    let startDate = payload.start_date;
    let endDate = payload.end_date;
    let duration = "";
    let note = payload.notes || payload.details;
    let booker = payload.booker.name;
    let pushMsg = "";
    const multiDays = startDate != endDate;
    const isToday = (new Date(startDate)).setHours(0,0,0,0) == (new Date()).setHours(0,0,0,0);
    const tomorrow = new Date().addDays(1);
    const isTomorrow = (new Date(startDate)).setHours(0,0,0,0) == tomorrow.setHours(0,0,0,0);

    action = payload.action === "create" ? "booked" : "removed";
    
    if(note)
        note = ` "${note}"`;

    if(action === "booked"){
        if(multiDays){
            pushMsg = `You're booked on ${project} from ${startDate} to ${endDate}.${note}`;
        }
        else{
            if(isToday)
                pushMsg = `You're booked on ${project} today.${note}`;
            else if(isTomorrow)
                pushMsg = `You're booked on ${project} tomorrow.${note}`;
            else
                pushMsg = `You're booked for ${project} on ${startDate}.${note}`;
        }
    }
    else if(action === "removed"){
        if(multiDays){
            pushMsg = `You're removed from ${project}, from ${startDate} to ${endDate}.${note}`; 
        }
        else{
            if(isToday)
                pushMsg = `You're removed from ${project} today.${note}`;
            else if(isTomorrow)
                pushMsg = `You're removed from ${project} tomorrow.${note}`;
            else
                pushMsg = `You're removed from ${project} on ${startDate}.${note}`;
        }
    }

    return { 
        pushMessage: pushMsg,
        projectName: project
    };

}

function determineRecipient(email){
    if(email.toLowerCase().includes("isna.firdaus"))
        email = "isna.firdaus@ogilvy.com.au";

    return email;
}