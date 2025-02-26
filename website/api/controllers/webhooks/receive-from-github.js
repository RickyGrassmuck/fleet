module.exports = {


  friendlyName: 'Receive from GitHub',


  description: 'Receive webhook requests and/or incoming auth redirects from GitHub.',


  extendedDescription: 'Useful for automation, visibility of changes, and abuse monitoring.',


  inputs: {
    botSignature: { type: 'string', },
    action: { type: 'string', example: 'opened', defaultsTo: 'ping', moreInfoUrl: 'https://developer.github.com/v3/activity/events/types' },
    sender: { required: true, type: {}, example: {login: 'johnabrams7'} },
    repository: { required: true, type: {}, example: {name: 'fleet', owner: {login: 'fleetdm'}} },
    changes: { type: {}, description: 'Only present when webhook request is related to an edit on GitHub.' },
    issue: { type: {} },
    comment: { type: {} },
    pull_request: { type: {} },//eslint-disable-line camelcase
    label: { type: {} },
  },


  fn: async function ({botSignature, action, sender, repository, changes, issue, comment, pull_request: pr, label}) {

    let GitHub = require('machinepack-github');

    let IS_FROZEN = false;// « Set this to `true` whenever a freeze is in effect, then set it back to `false` when the freeze ends.

    let GITHUB_USERNAMES_OF_BOTS_AND_MAINTAINERS = [// « Used in multiple places below.
      'sailsbot',
      'fleet-release',
      'noahtalerman',
      'mike-j-thomas',
      'mikermcneil',
      'lukeheath',
      'zwass',
      'martavis',
      'rachelelysia',
      'gillespi314',
      'chiiph',
      'mna',
      'edwardsb',
      'alphabrevity',
      'eashaw',
      'drewbakerfdm',
      'vercel[bot]',
      'lucasmrod',
      'tgauda',
      'ksatter',
      'guillaumeross',
      'dominuskelvin',
      'sharvilshah',
      'michalnicp',
      'desmi-dizney',
      'charlottechance',
      'timmy-k',
      'zwinnerman-fleetdm',
      'hollidayn',
      'juan-fdz-hawa',
      'roperzh',
      'zhumo',
    ];

    let GREEN_LABEL_COLOR = 'C2E0C6';// « Used in multiple places below.  (FUTURE: Use the "+" prefix for this instead of color.  2022-05-05)

    let GITHUB_USERNAME_OF_DRI_FOR_LABELS = 'noahtalerman';// « Used below (FUTURE: Remove this capability as Fleet has outgrown it.  2022-05-05)

    if (!sails.config.custom.slackWebhookUrlForGithubBot) {
      throw new Error('No Slack webhook URL configured for the GitHub bot to notify with alerts!  (Please set `sails.config.custom.slackWebhookUrlForGithubBot`.)');
    }//•

    if (!sails.config.custom.githubBotWebhookSecret) {
      throw new Error('No GitHub bot webhook secret configured!  (Please set `sails.config.custom.githubBotWebhookSecret`.)');
    }//•
    if (sails.config.custom.githubBotWebhookSecret !== botSignature) {
      throw new Error('Received unexpected GitHub webhook request with botSignature set to: '+botSignature);
    }//•

    if (!sails.config.custom.githubAccessToken) {
      throw new Error('No GitHub access token configured!  (Please set `sails.config.custom.githubAccessToken`.)');
    }//•
    let credentials = { accessToken: sails.config.custom.githubAccessToken };

    let issueOrPr = (pr || issue || undefined);

    let ghNoun = this.req.get('X-GitHub-Event');// See https://developer.github.com/v3/activity/events/types/
    // sails.log(ghNoun, action, {sender, repository, issue, comment, pr, label});
    if (
      (ghNoun === 'issues' &&        ['opened','reopened'].includes(action))
    ) {
      //  ██╗███████╗███████╗██╗   ██╗███████╗
      //  ██║██╔════╝██╔════╝██║   ██║██╔════╝
      //  ██║███████╗███████╗██║   ██║█████╗
      //  ██║╚════██║╚════██║██║   ██║██╔══╝
      //  ██║███████║███████║╚██████╔╝███████╗
      //  ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝
      //
      //   ██╗ ██████╗ ██████╗ ███████╗███╗   ██╗███████╗██████╗         ██╗    ██████╗ ███████╗ ██████╗ ██████╗ ███████╗███╗   ██╗███████╗██████╗ ██╗
      //  ██╔╝██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██╔══██╗       ██╔╝    ██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██╔══██╗╚██╗
      //  ██║ ██║   ██║██████╔╝█████╗  ██╔██╗ ██║█████╗  ██║  ██║      ██╔╝     ██████╔╝█████╗  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║█████╗  ██║  ██║ ██║
      //  ██║ ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██╔══╝  ██║  ██║     ██╔╝      ██╔══██╗██╔══╝  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██╔══╝  ██║  ██║ ██║
      //  ╚██╗╚██████╔╝██║     ███████╗██║ ╚████║███████╗██████╔╝    ██╔╝       ██║  ██║███████╗╚██████╔╝██║     ███████╗██║ ╚████║███████╗██████╔╝██╔╝
      //   ╚═╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚══════╝╚═════╝     ╚═╝        ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚══════╝╚═════╝ ╚═╝
      //
      // // Handle opened/reopened issue by commenting on it.
      // let owner = repository.owner.login;
      // let repo = repository.name;
      // let issueNumber = issueOrPr.number;
      // let newBotComment;
      // if (action === 'opened') {
      //   if (issueOrPr.state !== 'open') {
      //     newBotComment = '';// « checked below
      //   } else {
      //     newBotComment =
      //     `@${issueOrPr.user.login} Thanks for posting!  We'll take a look as soon as possible.\n`+
      //     `\n`+
      //     `In the mean time, there are a few ways you can help speed things along:\n`+
      //     ` - look for a workaround.  _(Even if it's just temporary, sharing your solution can save someone else a lot of time and effort.)_\n`+
      //     ` - tell us why this issue is important to you and your team.  What are you trying to accomplish?  _(Submissions with a little bit of human context tend to be easier to understand and faster to resolve.)_\n`+
      //     ` - make sure you've provided clear instructions on how to reproduce the bug from a clean install.\n`+
      //     ` - double-check that you've provided all of the requested version and dependency information.  _(Some of this info might seem irrelevant at first, like which database adapter you're using, but we ask that you include it anyway.  Oftentimes an issue is caused by a confluence of unexpected factors, and it can save everybody a ton of time to know all the details up front.)_\n`+
      //     ` - read the [code of conduct](https://sailsjs.com/documentation/contributing/code-of-conduct).\n`+
      //     ` - if appropriate, ask your business to [spons  or your issue](https://sailsjs.com/support).   _(Open source is our passion, and our core maintainers volunteer many of their nights and weekends working on Sails.  But you only get so many nights and weekends in life, and stuff gets done a lot faster when you can work on it during normal daylight hours.)_\n`+
      //     ` - let us know if you are using a 3rd party plugin; whether that's a database adapter, a non-standard view engine, or any other dependency maintained by someone other than our core team.  _(Besides the name of the 3rd party package, it helps to include the exact version you're using.  If you're unsure, check out [this list of all the core packages we maintain](https://sailsjs.com/architecture).)_ \n`+
      //     `<hr/>\n`+
      //     `\n`+
      //     `Please remember: never post in a public forum if you believe you've found a genuine security vulnerability.  Instead, [disclose it responsibly](https://sailsjs.com/security).\n`+
      //     `\n`+
      //     `For help with questions about Sails, [click here](http://sailsjs.com/support).\n`;
      //   }
      // } else {
      //   let wasReopenedByBot = GITHUB_USERNAMES_OF_BOTS_AND_MAINTAINERS.includes(sender.login.toLowerCase());
      //   if (wasReopenedByBot) {
      //     newBotComment = '';// « checked below
      //   } else {
      //     let greenLabels = _.filter(issueOrPr.labels, ({color}) => color === GREEN_LABEL_COLOR);
      //     await sails.helpers.flow.simultaneouslyForEach(greenLabels, async(greenLabel)=>{
      //       await GitHub.removeLabelFromIssue.with({ label: greenLabel.name, issueNumber, owner, repo, credentials });
      //     });//∞ß
      //     newBotComment =
      //     `Oh hey again, @${issueOrPr.user.login}.  Now that this issue is reopened, we'll take a fresh look as soon as we can!\n`+
      //     `<hr/>\n`+
      //     `\n`+
      //     `Please remember: never post in a public forum if you believe you've found a genuine security vulnerability.  Instead, [disclose it responsibly](https://sailsjs.com/security).\n`+
      //     `\n`+
      //     `For help with questions about Sails, [click here](http://sailsjs.com/support).\n`;
      //   }
      // }

      // // Now that we know what to say, add our comment.
      // if (newBotComment) {
      //   await GitHub.commentOnIssue.with({ comment: newBotComment, issueNumber, owner, repo, credentials });
      // }//ﬁ

    } else if (
      (ghNoun === 'pull_request' &&  ['opened','reopened','edited'].includes(action))
    ) {
      //  ██████╗ ██╗   ██╗██╗     ██╗         ██████╗ ███████╗ ██████╗ ██╗   ██╗███████╗███████╗████████╗
      //  ██╔══██╗██║   ██║██║     ██║         ██╔══██╗██╔════╝██╔═══██╗██║   ██║██╔════╝██╔════╝╚══██╔══╝
      //  ██████╔╝██║   ██║██║     ██║         ██████╔╝█████╗  ██║   ██║██║   ██║█████╗  ███████╗   ██║
      //  ██╔═══╝ ██║   ██║██║     ██║         ██╔══██╗██╔══╝  ██║▄▄ ██║██║   ██║██╔══╝  ╚════██║   ██║
      //  ██║     ╚██████╔╝███████╗███████╗    ██║  ██║███████╗╚██████╔╝╚██████╔╝███████╗███████║   ██║
      //  ╚═╝      ╚═════╝ ╚══════╝╚══════╝    ╚═╝  ╚═╝╚══════╝ ╚══▀▀═╝  ╚═════╝ ╚══════╝╚══════╝   ╚═╝
      //
      //   ██╗ ██████╗ ██████╗ ███████╗███╗   ██╗███████╗██████╗         ██╗    ███████╗██████╗ ██╗████████╗███████╗██████╗         ██╗    ██████╗ ███████╗ ██████╗ ██████╗ ███████╗███╗   ██╗███████╗██████╗ ██╗
      //  ██╔╝██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██╔══██╗       ██╔╝    ██╔════╝██╔══██╗██║╚══██╔══╝██╔════╝██╔══██╗       ██╔╝    ██╔══██╗██╔════╝██╔═══██╗██╔══██╗██╔════╝████╗  ██║██╔════╝██╔══██╗╚██╗
      //  ██║ ██║   ██║██████╔╝█████╗  ██╔██╗ ██║█████╗  ██║  ██║      ██╔╝     █████╗  ██║  ██║██║   ██║   █████╗  ██║  ██║      ██╔╝     ██████╔╝█████╗  ██║   ██║██████╔╝█████╗  ██╔██╗ ██║█████╗  ██║  ██║ ██║
      //  ██║ ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██╔══╝  ██║  ██║     ██╔╝      ██╔══╝  ██║  ██║██║   ██║   ██╔══╝  ██║  ██║     ██╔╝      ██╔══██╗██╔══╝  ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║██╔══╝  ██║  ██║ ██║
      //  ╚██╗╚██████╔╝██║     ███████╗██║ ╚████║███████╗██████╔╝    ██╔╝       ███████╗██████╔╝██║   ██║   ███████╗██████╔╝    ██╔╝       ██║  ██║███████╗╚██████╔╝██║     ███████╗██║ ╚████║███████╗██████╔╝██╔╝
      //   ╚═╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚══════╝╚═════╝     ╚═╝        ╚══════╝╚═════╝ ╚═╝   ╚═╝   ╚══════╝╚═════╝     ╚═╝        ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚══════╝╚═════╝ ╚═╝
      //

      let owner = repository.owner.login;
      let repo = repository.name;
      let prNumber = issueOrPr.number;

      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      // Want to do more?
      //
      // For some working, recent, easily-tweaked example code that manages a conversation with the GitHub bot
      // to get help submitters of PRs/issues get them up to spec, see:
      // https://github.com/fleetdm/fleet/blob/0a59adc2dd65bce5c1201a752e9c218faea7be35/website/api/controllers/webhooks/receive-from-github.js#L145-L216
      //
      // To potentially reuse:
      //     let newBotComment =
      //     `Oh hey again, @${issueOrPr.user.login}.  Now that this pull request is reopened, it's on our radar.  Please let us know if there's any new information we should be aware of!\n`+
      //     `<hr/>\n`+
      //     `\n`+
      //     `Please remember: never post in a public forum if you believe you've found a genuine security vulnerability.  Instead, [disclose it responsibly](https://sailsjs.com/security).\n`+
      //     `\n`+
      //     `For help with questions about Sails, [click here](http://sailsjs.com/support).\n`;
      // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -

      if (action === 'edited' && pr.state !== 'open') {// PR edited ‡
        // This is an edit to an already-closed pull request.
        // (Do nothing.)
      } else {// Either:
        // PR opened ‡  (Newly opened.)
        // PR reopened ‡   (This is a closed pull request, being reopened.  `action === 'reopened'`)

        let baseHeaders = {
          'User-Agent': 'Fleetie pie',
          'Authorization': `token ${sails.config.custom.githubAccessToken}`
        };

        require('assert')(sender.login !== undefined);

        // Check whether auto-approval is warranted.
        let isAutoApproved = await sails.helpers.githubAutomations.getIsPrPreapproved.with({
          prNumber: prNumber,
          githubUserToCheck: sender.login,
          isGithubUserMaintainerOrDoesntMatter: GITHUB_USERNAMES_OF_BOTS_AND_MAINTAINERS.includes(sender.login.toLowerCase())
        });

        // Now, if appropriate, auto-approve the change.
        if (isAutoApproved) {
          // [?] https://docs.github.com/en/rest/reference/pulls#create-a-review-for-a-pull-request
          await sails.helpers.http.post(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
            event: 'APPROVE'
          }, baseHeaders);
        } else if (IS_FROZEN) {
          // [?] https://docs.github.com/en/rest/reference/pulls#create-a-review-for-a-pull-request
          await sails.helpers.http.post(`https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/reviews`, {
            event: 'REQUEST_CHANGES',
            body: 'The repository is currently frozen for an upcoming release.  \n> After the freeze has ended, please dismiss this review.  \n\nIn case of emergency, you can dismiss this review and merge now.'
          }, baseHeaders);
        }

      }
    } else if (ghNoun === 'issue_comment' && ['created'].includes(action) && (issueOrPr&&issueOrPr.state === 'open')) {
      //   ██████╗ ██████╗ ███╗   ███╗███╗   ███╗███████╗███╗   ██╗████████╗
      //  ██╔════╝██╔═══██╗████╗ ████║████╗ ████║██╔════╝████╗  ██║╚══██╔══╝
      //  ██║     ██║   ██║██╔████╔██║██╔████╔██║█████╗  ██╔██╗ ██║   ██║
      //  ██║     ██║   ██║██║╚██╔╝██║██║╚██╔╝██║██╔══╝  ██║╚██╗██║   ██║
      //  ╚██████╗╚██████╔╝██║ ╚═╝ ██║██║ ╚═╝ ██║███████╗██║ ╚████║   ██║
      //   ╚═════╝ ╚═════╝ ╚═╝     ╚═╝╚═╝     ╚═╝╚══════╝╚═╝  ╚═══╝   ╚═╝
      //
      //   ██╗ ██████╗ ███╗   ██╗           ██████╗ ██████╗ ███████╗███╗   ██╗          ██████╗ ██████╗      ██████╗ ██████╗     ██╗███████╗███████╗██╗   ██╗███████╗██╗
      //  ██╔╝██╔═══██╗████╗  ██║    ▄ ██╗▄██╔═══██╗██╔══██╗██╔════╝████╗  ██║▄ ██╗▄    ██╔══██╗██╔══██╗    ██╔═══██╗██╔══██╗    ██║██╔════╝██╔════╝██║   ██║██╔════╝╚██╗
      //  ██║ ██║   ██║██╔██╗ ██║     ████╗██║   ██║██████╔╝█████╗  ██╔██╗ ██║ ████╗    ██████╔╝██████╔╝    ██║   ██║██████╔╝    ██║███████╗███████╗██║   ██║█████╗   ██║
      //  ██║ ██║   ██║██║╚██╗██║    ▀╚██╔▀██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║▀╚██╔▀    ██╔═══╝ ██╔══██╗    ██║   ██║██╔══██╗    ██║╚════██║╚════██║██║   ██║██╔══╝   ██║
      //  ╚██╗╚██████╔╝██║ ╚████║      ╚═╝ ╚██████╔╝██║     ███████╗██║ ╚████║  ╚═╝     ██║     ██║  ██║    ╚██████╔╝██║  ██║    ██║███████║███████║╚██████╔╝███████╗██╔╝
      //   ╚═╝ ╚═════╝ ╚═╝  ╚═══╝           ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝          ╚═╝     ╚═╝  ╚═╝     ╚═════╝ ╚═╝  ╚═╝    ╚═╝╚══════╝╚══════╝ ╚═════╝ ╚══════╝╚═╝
      //
      // Handle newly-created comment by ungreening its parent issue/PR (if appropriate).
      let owner = repository.owner.login;
      let repo = repository.name;
      let issueNumber = issueOrPr.number;

      let wasPostedByBot = GITHUB_USERNAMES_OF_BOTS_AND_MAINTAINERS.includes(sender.login.toLowerCase());
      if (!wasPostedByBot) {
        let greenLabels = _.filter(issueOrPr.labels, ({color}) => color === GREEN_LABEL_COLOR);
        await sails.helpers.flow.simultaneouslyForEach(greenLabels, async(greenLabel)=>{
          await GitHub.removeLabelFromIssue.with({ label: greenLabel.name, issueNumber, owner, repo, credentials });
        });//∞ß
      }//ﬁ
    } else if (
      (ghNoun === 'issue_comment' && ['deleted'].includes(action) && !GITHUB_USERNAMES_OF_BOTS_AND_MAINTAINERS.includes(comment.user.login))||
      (ghNoun === 'commit_comment' && ['created'].includes(action) && !GITHUB_USERNAMES_OF_BOTS_AND_MAINTAINERS.includes(comment.user.login))||
      (ghNoun === 'label' && false /* label change notifications temporarily disabled until digital experience team has time to clean up labels.  FUTURE: turn this back on after doing that cleanup to facilitate gradual ongoing maintenance and education rather than herculean cleanup efforts and retraining */ && ['created','edited','deleted'].includes(action) && GITHUB_USERNAME_OF_DRI_FOR_LABELS !== sender.login.toLowerCase())||//« exempt label changes made by the directly responsible individual for labels, because otherwise when process changes/fiddlings happen, they can otherwise end up making too much noise in Slack
      (ghNoun === 'issue_comment' && ['created'].includes(action) && issueOrPr.state !== 'open' && (issueOrPr.closed_at) && ((new Date(issueOrPr.closed_at)).getTime() < Date.now() - 7*24*60*60*1000 ) && !GITHUB_USERNAMES_OF_BOTS_AND_MAINTAINERS.includes(sender.login.toLowerCase()) )
    ) {
      //  ██╗███╗   ██╗███████╗ ██████╗ ██████╗ ███╗   ███╗    ██╗   ██╗███████╗
      //  ██║████╗  ██║██╔════╝██╔═══██╗██╔══██╗████╗ ████║    ██║   ██║██╔════╝
      //  ██║██╔██╗ ██║█████╗  ██║   ██║██████╔╝██╔████╔██║    ██║   ██║███████╗
      //  ██║██║╚██╗██║██╔══╝  ██║   ██║██╔══██╗██║╚██╔╝██║    ██║   ██║╚════██║
      //  ██║██║ ╚████║██║     ╚██████╔╝██║  ██║██║ ╚═╝ ██║    ╚██████╔╝███████║
      //  ╚═╝╚═╝  ╚═══╝╚═╝      ╚═════╝ ╚═╝  ╚═╝╚═╝     ╚═╝     ╚═════╝ ╚══════╝
      //
      //   ██╗██╗███╗   ██╗    ███████╗██╗      █████╗  ██████╗██╗  ██╗██╗
      //  ██╔╝██║████╗  ██║    ██╔════╝██║     ██╔══██╗██╔════╝██║ ██╔╝╚██╗
      //  ██║ ██║██╔██╗ ██║    ███████╗██║     ███████║██║     █████╔╝  ██║
      //  ██║ ██║██║╚██╗██║    ╚════██║██║     ██╔══██║██║     ██╔═██╗  ██║
      //  ╚██╗██║██║ ╚████║    ███████║███████╗██║  ██║╚██████╗██║  ██╗██╔╝
      //   ╚═╝╚═╝╚═╝  ╚═══╝    ╚══════╝╚══════╝╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝
      //
      // Handle deleted issue/PR comments, new/modified/deleted commit comments,
      // new/edited/deleted labels, and new comments on closed issues/PRs by
      // posting to the Fleet Slack.
      // > FUTURE: also post to Slack about deleted issues, new repos, and deleted repos
      await sails.helpers.http.post(
        sails.config.custom.slackWebhookUrlForGithubBot,//« #g-operations channel (Fleet Slack workspace)
        {
          text:
          (
            (ghNoun === 'issue_comment' && action === 'deleted') ?
              `@${sender.login} just deleted a GitHub comment that was originally posted at ${(new Date(comment.created_at)).toString()} by @${comment.user.login} in ${issueOrPr.html_url}.\n\nFormerly, the comment read:\n\`\`\`\n${comment.body}\n\`\`\``
            : (ghNoun === 'commit_comment') ?
              `@${sender.login} just created a new GitHub commit comment in ${repository.owner.login}/${repository.name}:\n\n> ${comment.html_url}\n\`\`\`\n${comment.body}\n\`\`\``
            : (ghNoun === 'label' && action === 'edited') ?
              `@${sender.login} just edited a GitHub label "*${label.name}*" (#${label.color}) in ${repository.owner.login}/${repository.name}.\n\nChanges:\n\`\`\`\n${Object.keys(changes).length === 0 ? 'GitHub did not report any changes.  This usually means the label description was updated (because label descriptions are not available via the GitHub API.)' : require('util').inspect(changes,{depth:null})}\n\`\`\`\n\n> To manage labels in ${repository.owner.login}/${repository.name}, visit https://github.com/${encodeURIComponent(repository.owner.login)}/${encodeURIComponent(repository.name)}/labels`
            : (ghNoun === 'label') ?
              `@${sender.login} just ${action} a GitHub label "*${label.name}*" (#${label.color}) in ${repository.owner.login}/${repository.name}.\n\n> To manage labels in ${repository.owner.login}/${repository.name}, visit https://github.com/${encodeURIComponent(repository.owner.login)}/${encodeURIComponent(repository.name)}/labels`
            :
              `@${sender.login} just created a zombie comment in a GitHub issue or PR that had already been closed for >7 days (${issueOrPr.html_url}):\n\n> ${comment.html_url}\n\`\`\`\n${comment.body}\n\`\`\``
          )+`\n`
        },
        {'Content-Type':'application/json'}
      )
      .timeout(5000)
      .retry([{name: 'TimeoutError'}, 'non200Response', 'requestFailed']);
    } else {
      //  ███╗   ███╗██╗███████╗ ██████╗
      //  ████╗ ████║██║██╔════╝██╔════╝
      //  ██╔████╔██║██║███████╗██║
      //  ██║╚██╔╝██║██║╚════██║██║
      //  ██║ ╚═╝ ██║██║███████║╚██████╗
      //  ╚═╝     ╚═╝╚═╝╚══════╝ ╚═════╝
      //
      // FUTURE: more potential stuff
      //
      // For reference:  (as of Apr 16, 2019)
      // Ping                  : (no "action" included)
      // Issue                 : opened, edited, deleted, transferred, pinned, unpinned, closed, reopened, assigned, unassigned, labeled, unlabeled, milestoned, demilestoned   (https://developer.github.com/v3/activity/events/types/#issuesevent)
      // PR                    : opened, closed, reopened, edited, assigned, unassigned, review requested, review request removed, labeled, unlabeled, synchronized, ready for review   (https://developer.github.com/v3/activity/events/types/#pullrequestevent)
      // Comment (pr or issue) : created, edited, deleted   (https://developer.github.com/v3/activity/events/types/#issuecommentevent)
      // Label                 : created, edited, deleted   (https://developer.github.com/v3/activity/events/types/#labelevent)
      // Commit comment        : created   (https://developer.github.com/v3/activity/events/types/#commitcommentevent)
      // PR review             : submitted, edited, dismissed   (https://developer.github.com/v3/activity/events/types/#pullrequestreviewevent
      // PR review comment     : created, edited, deleted   (https://developer.github.com/v3/activity/events/types/#pullrequestreviewcommentevent)
      // Branch, tag, or repo  : created, deleted   (https://developer.github.com/v3/activity/events/types/#createevent -- note thate "ref_type" can be either "tag", "branch", or "repository")
    }

  }


};
