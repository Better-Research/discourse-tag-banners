import { createWidget } from "discourse/widgets/widget";
import { getOwner } from "discourse-common/lib/get-owner";
import { h } from "virtual-dom";
import { ajax } from 'discourse/lib/ajax';


export default createWidget("tag-header-widget", {
  tagName: "span",

  buildKey: () => `tag-header-widget`,

  defaultState() {
    return { loaded: false, tag: null, info: null };
  },

  getTagInfo(tag) {
    this.store.find("tag-info", tag).then((result) => {
      this.state.tag = result;
      this.state.loaded = true;
      this.scheduleRerender();
    }).then(() => {
      if (this.state.loaded) {
        ajax("/paper_store/" + tag + ".json").then(response =>  {
          console.log(response)
          return response
        }).then(data => {
            if(!data.hasOwnProperty("error")) {
              var data_json = JSON.parse(data["result"]);
              if (data_json != null) {
                var authors = JSON.parse(data_json["authors"]).join(", ") 
                this.state.info = h("span", [h('p', authors), h('p', data_json["abstract"])])
                this.scheduleRerender();
              }
              else {
                this.state.info = null;
                this.scheduleRerender();
              }
            }
            else {
              this.state.info = null;
              this.scheduleRerender();
            }
            
          });
      }
    });
    
  },

  html() {
    const router = getOwner(this).lookup("router:main");
    const route = router.currentRoute;
    const hideMobile =
      !settings.show_on_mobile && this.site.mobileView ? true : false;

    if (route && route.params && route.params.hasOwnProperty("tag_id")) {
      let tag = route.params.tag_id;
      let formattedTagName = tag;

      let additionalTags = route.params.additional_tags;
      let formattedAdditionalTagNames = additionalTags;

      if (settings.remove_tag_hyphen) {
        formattedTagName = formattedTagName.replace(/-/g, " ");
        formattedAdditionalTagNames = formattedAdditionalTagNames
          ? formattedAdditionalTagNames.replace(/-/g, " ")
          : null;
      }

      if (settings.remove_tag_underscore) {
        formattedTagName = formattedTagName.replace(/_/g, " ");
        formattedAdditionalTagNames = formattedAdditionalTagNames
          ? formattedAdditionalTagNames.replace(/_/g, " ")
          : null;
      }

      if (!hideMobile && tag !== "none") {
        document.querySelector("body").classList.add("tag-banner");

        let additionalClass;
        let tagDescription;

        if (additionalTags) {
          let tagList = formattedAdditionalTagNames.split("/");
          let additionalClassList = tagList.map(function (e) {
            return `tag-banner-${e}`;
          });
          formattedAdditionalTagNames = h("span", ` & ${tagList.join(" & ")}`);
          additionalClass = additionalClassList.join(".");
        } else {
          additionalClass = "single-tag";
        }

        if (!this.state.loaded) {
          this.getTagInfo(tag);
        } else {
          if (this.state.tag.name !== tag) {
            // update the tag description when the route's tag changes
            this.getTagInfo(tag);
          }

          if (additionalTags || !settings.show_tag_description) {
            tagDescription = "";
          } else {
            tagDescription = this.state.tag.description;
          }

          return h(
            `div.tag-title-header .tag-banner-${tag} .${additionalClass}`,
            h("div.tag-title-contents", [
              h("h1", [
                h("span", formattedTagName),
                formattedAdditionalTagNames,
              ]),
              h("p", tagDescription), 
              this.state.info,
              h("strong", "PDF: "),
              h("a", {href: "https://eprint.iacr.org/" + tag.replace("-", "/") + ".pdf"}, "https://eprint.iacr.org/" + tag.replace("-", "/") + ".pdf")
            ])
          );
        }
      } else {
        document.querySelector("body").classList.remove("tag-banner");
      }
    }
  },
});
