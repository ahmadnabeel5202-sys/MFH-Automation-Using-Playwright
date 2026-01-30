exports.loginpage= class Loginpage{
    constructor(page){

       this.page = page;
    //    this.loginlink= '#login2';
       this.usernameinput= '#username';
       this.passwordinput='#password';
       this.Signin="button[type='submit']";
    }
    async gotoLoginPage(){
        await this.page.goto('/');

    }

    async login(username, password){
        // await this.page.locator(this.loginlink).click();
        await this.page.locator(this.usernameinput).fill(username);
        await this.page.locator(this.passwordinput).fill(password);
        // await this.page.locator(this.Signin).click();
        await Promise.all([
        this.page.waitForNavigation(), // Navigation ka intezar
        this.page.locator(this.Signin).click() // Button click
    ]);
        
    }
     // Optional: Combine both methods into one
    async performLogin(username, password) {
        await this.gotoLoginPage();
        await this.login(username, password);
    }
}